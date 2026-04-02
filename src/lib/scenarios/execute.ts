import { createAdminClient } from '@/lib/supabase/admin'
import { buildSmsMessages, buildAlimTalkMessages, buildFriendTalkMessages } from '@/lib/solapi'
import { SolapiMessageService } from 'solapi'
import { applyVariableBindings } from '@/lib/campaigns/variables'
import type { Lead } from '@/types'

interface SolapiConfig {
  api_key: string
  api_secret: string
  sender_phone: string
}

/**
 * Cron에서 호출: 순차 발송 + 일괄 발송 모두 처리
 */
export async function processScenarioEnrollments() {
  const sequential = await processSequentialScenarios()
  const scheduled = await processScheduledScenarios()
  return { processed: sequential.processed + scheduled.processed }
}

/**
 * 순차 발송 (D+N enrollment 기반)
 */
async function processSequentialScenarios() {
  const supabase = createAdminClient()
  const now = new Date()

  const { data: enrollments } = await supabase
    .from('scenario_enrollments')
    .select(`
      id,
      workspace_id,
      scenario_id,
      lead_id,
      enrolled_at,
      current_step
    `)
    .eq('status', 'active')

  if (!enrollments || enrollments.length === 0) return { processed: 0 }

  let processed = 0

  // 워크스페이스별로 그룹핑 (Solapi config 캐싱)
  const byWorkspace = new Map<string, typeof enrollments>()
  for (const e of enrollments) {
    const list = byWorkspace.get(e.workspace_id) ?? []
    list.push(e)
    byWorkspace.set(e.workspace_id, list)
  }

  for (const [workspaceId, wsEnrollments] of byWorkspace) {
    const config = await loadSolapiConfig(workspaceId)
    if (!config) continue

    // 시나리오별로 스텝 캐싱 (sequential만)
    const stepsCache = new Map<string, any[]>()
    const scenarioTypeCache = new Map<string, string>()
    const scenarioSendTimeCache = new Map<string, string | null>()

    for (const enrollment of wsEnrollments) {
      // 시나리오 정보 + 스텝 로드 (캐시)
      if (!stepsCache.has(enrollment.scenario_id)) {
        const { data: scenario } = await supabase
          .from('scenarios')
          .select('scenario_type, send_time')
          .eq('id', enrollment.scenario_id)
          .single()
        scenarioTypeCache.set(enrollment.scenario_id, scenario?.scenario_type ?? 'sequential')
        scenarioSendTimeCache.set(enrollment.scenario_id, scenario?.send_time ?? null)

        const { data: steps } = await supabase
          .from('scenario_steps')
          .select('*')
          .eq('scenario_id', enrollment.scenario_id)
          .order('step_order', { ascending: true })
        stepsCache.set(enrollment.scenario_id, steps ?? [])
      }

      // scheduled 시나리오는 별도 처리
      if (scenarioTypeCache.get(enrollment.scenario_id) === 'scheduled') continue

      const steps = stepsCache.get(enrollment.scenario_id) ?? []
      if (steps.length === 0) continue

      // 현재 실행할 스텝 찾기
      const nextStep = steps.find((s) => s.step_order === enrollment.current_step)
      if (!nextStep) {
        await supabase
          .from('scenario_enrollments')
          .update({ status: 'completed', completed_at: now.toISOString() })
          .eq('id', enrollment.id)
        continue
      }

      // D+N 조건 확인 + send_time 체크
      const enrolledAt = new Date(enrollment.enrolled_at)
      const targetDate = new Date(enrolledAt)
      targetDate.setDate(targetDate.getDate() + nextStep.delay_days)

      // send_time이 설정되어 있으면 해당 시각까지 기다림
      const sendTime = scenarioSendTimeCache.get(enrollment.scenario_id)
      if (sendTime) {
        const [hh, mm] = sendTime.split(':').map(Number)
        targetDate.setHours(hh, mm, 0, 0)
      }

      if (now < targetDate) continue

      // 이미 실행된 스텝인지 확인
      const { count } = await supabase
        .from('scenario_logs')
        .select('*', { count: 'exact', head: true })
        .eq('enrollment_id', enrollment.id)
        .eq('step_id', nextStep.id)

      if (count && count > 0) {
        const nextOrder = enrollment.current_step + 1
        const hasMore = steps.some((s) => s.step_order === nextOrder)
        if (hasMore) {
          await supabase
            .from('scenario_enrollments')
            .update({ current_step: nextOrder })
            .eq('id', enrollment.id)
        } else {
          await supabase
            .from('scenario_enrollments')
            .update({ status: 'completed', completed_at: now.toISOString() })
            .eq('id', enrollment.id)
        }
        continue
      }

      // 리드 조회
      const { data: lead } = await supabase
        .from('leads')
        .select('*')
        .eq('id', enrollment.lead_id)
        .single()

      if (!lead) {
        await supabase
          .from('scenario_enrollments')
          .update({ status: 'cancelled' })
          .eq('id', enrollment.id)
        continue
      }

      // 발송 실행
      const result = await executeStepSend(config, nextStep, lead as Lead)

      // 로그 기록
      await supabase.from('scenario_logs').insert({
        workspace_id: workspaceId,
        enrollment_id: enrollment.id,
        step_id: nextStep.id,
        lead_id: lead.id,
        phone: lead.phone,
        lead_name: lead.name,
        status: result.success ? 'sent' : 'failed',
        error_message: result.error ?? null,
        sent_at: now.toISOString(),
      })

      // enrollment 진행
      const nextOrder = enrollment.current_step + 1
      const hasMore = steps.some((s) => s.step_order === nextOrder)
      if (hasMore) {
        await supabase
          .from('scenario_enrollments')
          .update({ current_step: nextOrder })
          .eq('id', enrollment.id)
      } else {
        await supabase
          .from('scenario_enrollments')
          .update({ status: 'completed', completed_at: now.toISOString() })
          .eq('id', enrollment.id)
      }

      processed++
    }
  }

  return { processed }
}

/**
 * 일괄 발송 (scheduled) — 발송 시점에 세그먼트 전체 리드에게 발송
 */
async function processScheduledScenarios() {
  const supabase = createAdminClient()
  const now = new Date()
  let processed = 0

  // 활성 + scheduled 시나리오 조회
  const { data: scenarios } = await supabase
    .from('scenarios')
    .select('id, workspace_id')
    .eq('is_active', true)
    .eq('scenario_type', 'scheduled')

  if (!scenarios?.length) return { processed: 0 }

  for (const scenario of scenarios) {
    const config = await loadSolapiConfig(scenario.workspace_id)
    if (!config) continue

    // 스텝 조회
    const { data: steps } = await supabase
      .from('scenario_steps')
      .select('*')
      .eq('scenario_id', scenario.id)
      .order('step_order', { ascending: true })

    if (!steps?.length) continue

    for (const step of steps) {
      if (!step.scheduled_at) continue

      const scheduledAt = new Date(step.scheduled_at)
      // 아직 발송 시간이 안 됐으면 스킵
      if (now < scheduledAt) continue

      // 이미 발송된 스텝인지 확인 (scenario_logs에 해당 step_id 로그가 있으면 스킵)
      const { count: alreadySent } = await supabase
        .from('scenario_logs')
        .select('*', { count: 'exact', head: true })
        .eq('step_id', step.id)

      if (alreadySent && alreadySent > 0) continue

      // 타겟 세그먼트 기반 리드 조회
      const leads = await resolveTargetLeads(scenario.workspace_id, step.target_filter)
      if (leads.length === 0) continue

      // 각 리드에게 발송
      for (const lead of leads) {
        const result = await executeStepSend(config, step, lead)

        await supabase.from('scenario_logs').insert({
          workspace_id: scenario.workspace_id,
          enrollment_id: null,
          step_id: step.id,
          lead_id: lead.id,
          phone: lead.phone,
          lead_name: lead.name,
          status: result.success ? 'sent' : 'failed',
          error_message: result.error ?? null,
          sent_at: now.toISOString(),
        })

        if (result.success) processed++
      }
    }
  }

  return { processed }
}

/**
 * target_filter 기반으로 대상 리드 조회
 */
async function resolveTargetLeads(
  workspaceId: string,
  targetFilter: any
): Promise<Lead[]> {
  const supabase = createAdminClient()
  const filterType = targetFilter?.type ?? 'all'

  if (filterType === 'group' && targetFilter?.group_id) {
    // 그룹 멤버십 기반 조회
    const { data: memberships } = await supabase
      .from('lead_group_memberships')
      .select('lead_id')
      .eq('group_id', targetFilter.group_id)

    if (!memberships?.length) return []

    const leadIds = memberships.map((m) => m.lead_id)
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in('id', leadIds)

    return (leads ?? []) as Lead[]
  }

  if (filterType === 'source' && targetFilter?.source) {
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('source', targetFilter.source)

    return (leads ?? []) as Lead[]
  }

  // 'all' — 워크스페이스 전체 리드
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('workspace_id', workspaceId)

  return (leads ?? []) as Lead[]
}

/**
 * Solapi 연동 설정 로드
 */
async function loadSolapiConfig(workspaceId: string): Promise<SolapiConfig | null> {
  const supabase = createAdminClient()
  const { data: integration } = await supabase
    .from('workspace_integrations')
    .select('config')
    .eq('workspace_id', workspaceId)
    .eq('provider', 'solapi')
    .single()

  const config = integration?.config as any
  if (!config?.api_key || !config?.api_secret) return null
  return {
    api_key: config.api_key,
    api_secret: config.api_secret,
    sender_phone: config.sender_phone ?? '',
  }
}

/**
 * 단일 리드에게 스텝 메시지 발송
 * - variable_bindings가 있으면 바인딩 기반 치환
 * - 없으면 기존 방식 (buildReplacements)
 */
async function executeStepSend(
  config: SolapiConfig,
  step: any,
  lead: Lead
): Promise<{ success: boolean; error?: string }> {
  try {
    const solapiClient = new SolapiMessageService(config.api_key, config.api_secret)
    const bindings = step.variable_bindings as Record<string, { type: 'field' | 'fixed'; value: string }> | null

    // 변수 바인딩이 있으면 메시지 치환
    const messageContent = bindings && Object.keys(bindings).length > 0
      ? applyVariableBindings(step.message_content, bindings, lead)
      : step.message_content

    const kakaoOpts = step.kakao_options as any

    let messageData
    if (step.message_type === 'ALIMTALK' && step.template_id) {
      messageData = buildAlimTalkMessages({
        leads: [lead],
        template: messageContent,
        senderPhone: config.sender_phone,
        pfId: kakaoOpts?.pf_id ?? '',
        templateId: step.template_id,
      })
    } else if (step.message_type === 'FRIENDTALK' && kakaoOpts?.pf_id) {
      messageData = buildFriendTalkMessages({
        leads: [lead],
        template: messageContent,
        senderPhone: config.sender_phone,
        pfId: kakaoOpts.pf_id,
        imageId: kakaoOpts.image_id,
        adFlag: kakaoOpts.ad_flag ?? false,
      })
    } else {
      messageData = buildSmsMessages({
        leads: [lead],
        template: messageContent,
        senderPhone: config.sender_phone,
      })
    }

    const result = await solapiClient.send(messageData.messages as any)
    const failedList = result.failedMessageList ?? []

    if (failedList.length > 0) {
      return { success: false, error: (failedList[0] as any)?.reason ?? '발송 실패' }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message ?? '발송 중 오류 발생' }
  }
}
