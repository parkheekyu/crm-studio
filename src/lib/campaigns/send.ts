import { createAdminClient } from '@/lib/supabase/admin'
import { sendMessagesAsSubAccount, type SolapiMessage } from '@/lib/solapi-central'
import { buildReplacements } from '@/lib/campaigns/variables'
import type { Lead } from '@/types'

const BATCH_SIZE = 10000

/**
 * 캠페인 발송 오케스트레이션
 * - 중앙 Solapi 계정으로 발송
 * - 워크스페이스 크레딧에서 비용 차감
 */
export async function executeCampaignSend(campaignId: string) {
  const supabase = createAdminClient()

  // 1. 캠페인 로드
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (campaignError || !campaign) {
    throw new Error('캠페인을 찾을 수 없습니다.')
  }

  if (campaign.status !== 'draft') {
    throw new Error('발송 가능한 상태가 아닙니다.')
  }

  // 2. SSO 연동 정보 조회 (accountId + sender_phone)
  const { data: integration } = await supabase
    .from('workspace_integrations')
    .select('config')
    .eq('workspace_id', campaign.workspace_id)
    .eq('provider', 'solapi_sso')
    .single()

  const config = integration?.config as any
  if (!config?.account_id) {
    throw new Error('발송 서비스 연동이 필요합니다. 설정 → 발송 설정에서 연동해 주세요.')
  }

  const accountId: string = config.account_id
  const senderPhone: string = config.sender_phone ?? ''

  // 3. 대상 리드 조회
  const filter = campaign.target_filter as any
  let leads: any[] | null = null

  if (filter?.mode === 'combined') {
    const leadIdSets = new Set<string>()

    const groupIds: string[] = filter.group_ids ?? []
    if (groupIds.length > 0) {
      const { data: memberships } = await supabase
        .from('lead_group_memberships')
        .select('lead_id')
        .in('group_id', groupIds)
      for (const m of memberships ?? []) leadIdSets.add(m.lead_id)
    }

    const filterSources: string[] = filter.sources ?? []
    if (filterSources.length > 0) {
      const { data: sourceLeads } = await supabase
        .from('leads')
        .select('id')
        .eq('workspace_id', campaign.workspace_id)
        .in('source', filterSources)
      for (const l of sourceLeads ?? []) leadIdSets.add(l.id)
    }

    const directIds: string[] = filter.lead_ids ?? []
    for (const id of directIds) leadIdSets.add(id)

    if (leadIdSets.size === 0) throw new Error('수신자를 선택해 주세요.')

    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('workspace_id', campaign.workspace_id)
      .in('id', [...leadIdSets])
    leads = data
  } else {
    let query = supabase
      .from('leads')
      .select('*')
      .eq('workspace_id', campaign.workspace_id)

    if (filter?.mode === 'manual' && filter.lead_ids?.length > 0) {
      query = query.in('id', filter.lead_ids)
    } else if (filter?.mode === 'filtered' && filter.source) {
      query = query.eq('source', filter.source)
    }

    const groupIds: string[] = filter?.group_ids ?? (filter?.group_id ? [filter.group_id] : [])
    if (groupIds.length > 0) {
      const { data: memberships } = await supabase
        .from('lead_group_memberships')
        .select('lead_id')
        .in('group_id', groupIds)
      const memberLeadIds = [...new Set((memberships ?? []).map((m) => m.lead_id))]
      if (memberLeadIds.length === 0) throw new Error('선택한 그룹에 리드가 없습니다.')
      query = query.in('id', memberLeadIds)
    }

    const { data } = await query
    leads = data
  }

  if (!leads || leads.length === 0) throw new Error('수신자를 선택해 주세요.')

  const msgType = campaign.message_type ?? 'SMS'

  // 4. 캠페인 → sending 상태
  await supabase
    .from('campaigns')
    .update({ status: 'sending', total_count: leads.length })
    .eq('id', campaignId)

  let successCount = 0
  let failCount = 0

  // 5. 배치 발송
  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    const batch = leads.slice(i, i + BATCH_SIZE) as Lead[]

    try {
      const kakaoOpts = campaign.kakao_options as any
      const messages = buildCampaignMessages(batch, campaign.message_content, senderPhone, msgType, kakaoOpts)

      const result = await sendMessagesAsSubAccount(accountId, messages)
      const failedPhones = new Set(result.failedList.map((f) => f.to))

      const logs = batch.map((lead) => {
        const phone = lead.phone.replace(/[^0-9]/g, '')
        const isFailed = failedPhones.has(phone)
        if (isFailed) failCount++
        else successCount++
        return {
          workspace_id: campaign.workspace_id,
          campaign_id: campaignId,
          lead_id: lead.id,
          phone: lead.phone,
          lead_name: lead.name,
          status: isFailed ? 'failed' : 'sent',
          sent_at: new Date().toISOString(),
        }
      })

      await supabase.from('message_logs').insert(logs)
    } catch (err: any) {
      failCount += batch.length
      const logs = batch.map((lead) => ({
        workspace_id: campaign.workspace_id,
        campaign_id: campaignId,
        lead_id: lead.id,
        phone: lead.phone,
        lead_name: lead.name,
        status: 'failed',
        error_message: err.message ?? '발송 중 오류 발생',
        sent_at: new Date().toISOString(),
      }))
      await supabase.from('message_logs').insert(logs)
    }
  }

  // 8. 캠페인 최종 상태
  const finalStatus = successCount > 0 ? 'completed' : 'failed'
  await supabase
    .from('campaigns')
    .update({
      status: finalStatus,
      success_count: successCount,
      fail_count: failCount,
      sent_at: new Date().toISOString(),
    })
    .eq('id', campaignId)

  return { successCount, failCount, total: leads.length }
}

function buildCampaignMessages(
  leads: Lead[],
  template: string,
  senderPhone: string,
  msgType: string,
  kakaoOpts: any
): SolapiMessage[] {
  const from = senderPhone.replace(/[^0-9]/g, '')
  return leads.map((lead) => {
    const to = lead.phone.replace(/[^0-9]/g, '')
    const text = template
    if (msgType === 'ATA' && kakaoOpts?.pf_id && kakaoOpts?.template_id) {
      return { to, from, text, kakaoOptions: { pfId: kakaoOpts.pf_id, templateId: kakaoOpts.template_id } }
    }
    if (msgType === 'FT' && kakaoOpts?.pf_id) {
      return {
        to, from,
        kakaoOptions: {
          pfId: kakaoOpts.pf_id,
          messageType: kakaoOpts.image_id ? 'FI' : 'FT',
          content: text,
          adFlag: kakaoOpts.ad_flag ?? false,
          ...(kakaoOpts.image_id ? { imageId: kakaoOpts.image_id } : {}),
        },
      }
    }
    return { to, from, text }
  })
}
