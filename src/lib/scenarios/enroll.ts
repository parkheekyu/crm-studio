import { createAdminClient } from '@/lib/supabase/admin'

/**
 * 리드를 워크스페이스의 활성 시나리오에 자동 등록
 * - trigger_type = 'auto_on_create' 시나리오만 대상
 * - trigger_filter.source 가 있으면 리드의 source와 매칭 확인
 * - 이미 등록된 시나리오는 UNIQUE 제약으로 무시
 */
export async function enrollLeadInScenarios(
  leadId: string,
  workspaceId: string,
  leadSource?: string | null
) {
  const supabase = createAdminClient()

  // 활성 + 자동등록 시나리오 조회
  const { data: scenarios } = await supabase
    .from('scenarios')
    .select('id, trigger_filter')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .eq('trigger_type', 'auto_on_create')

  if (!scenarios || scenarios.length === 0) return

  const enrollments = scenarios
    .filter((scenario) => {
      const filter = scenario.trigger_filter as any
      // 그룹 기반 시나리오는 리드 생성 시에는 스킵 (그룹 추가 시에만 발동)
      if (filter?.group_id) return false
      if (!filter?.source) return true
      return leadSource === filter.source
    })
    .map((scenario) => ({
      workspace_id: workspaceId,
      scenario_id: scenario.id,
      lead_id: leadId,
      current_step: 0,
      status: 'active' as const,
    }))

  if (enrollments.length === 0) return

  // 중복 무시 (UNIQUE 위반 시 skip)
  await supabase
    .from('scenario_enrollments')
    .upsert(enrollments, { onConflict: 'scenario_id,lead_id', ignoreDuplicates: true })
}

/**
 * 여러 리드를 한 번에 시나리오에 등록 (CSV 업로드, 수동 등록용)
 */
export async function enrollLeadsInScenarios(
  leadIds: string[],
  workspaceId: string,
  leadSources?: Record<string, string | null>
) {
  for (const leadId of leadIds) {
    await enrollLeadInScenarios(leadId, workspaceId, leadSources?.[leadId])
  }
}

/**
 * 리드를 그룹 기반 시나리오에 자동 등록
 * - trigger_filter.group_id 가 일치하는 시나리오에 등록
 */
export async function enrollLeadInGroupScenarios(
  leadId: string,
  workspaceId: string,
  groupId: string
) {
  const supabase = createAdminClient()

  const { data: scenarios } = await supabase
    .from('scenarios')
    .select('id, trigger_filter')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .eq('trigger_type', 'auto_on_create')

  if (!scenarios?.length) return

  const enrollments = scenarios
    .filter((s) => {
      const filter = s.trigger_filter as any
      return filter?.group_id === groupId
    })
    .map((s) => ({
      workspace_id: workspaceId,
      scenario_id: s.id,
      lead_id: leadId,
      current_step: 0,
      status: 'active' as const,
    }))

  if (!enrollments.length) return

  await supabase
    .from('scenario_enrollments')
    .upsert(enrollments, { onConflict: 'scenario_id,lead_id', ignoreDuplicates: true })
}

/**
 * 여러 리드를 그룹 기반 시나리오에 등록
 */
export async function enrollLeadsInGroupScenarios(
  leadIds: string[],
  workspaceId: string,
  groupId: string
) {
  for (const leadId of leadIds) {
    await enrollLeadInGroupScenarios(leadId, workspaceId, groupId)
  }
}
