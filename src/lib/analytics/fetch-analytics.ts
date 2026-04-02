import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  AnalyticsSummary,
  DailySendData,
  CampaignPerformance,
  ScenarioPerformance,
  MessageTypeDistribution,
} from '@/types/analytics'

const TYPE_LABELS: Record<string, string> = {
  SMS: '문자(SMS)',
  LMS: '장문(LMS)',
  ATA: '알림톡',
  FTA: '친구톡',
}

/**
 * 전체 요약 통계
 */
export async function fetchAnalyticsSummary(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<AnalyticsSummary> {
  // 캠페인 집계
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('total_count, success_count, fail_count')
    .eq('workspace_id', workspaceId)
    .in('status', ['completed', 'failed'])

  let totalSent = 0
  let successCount = 0
  let failCount = 0

  for (const c of campaigns ?? []) {
    totalSent += c.total_count ?? 0
    successCount += c.success_count ?? 0
    failCount += c.fail_count ?? 0
  }

  // 시나리오 로그 집계
  const { data: scenarioLogs } = await supabase
    .from('scenario_logs')
    .select('status')
    .eq('workspace_id', workspaceId)

  for (const log of scenarioLogs ?? []) {
    totalSent++
    if (log.status === 'sent') successCount++
    else if (log.status === 'failed') failCount++
  }

  // 시나리오 enrollment 집계
  const { data: enrollments } = await supabase
    .from('scenario_enrollments')
    .select('status')
    .eq('workspace_id', workspaceId)

  const scenarioEnrollments = enrollments?.length ?? 0
  const scenarioCompletions = enrollments?.filter((e) => e.status === 'completed').length ?? 0

  return {
    totalSent,
    successCount,
    failCount,
    successRate: totalSent > 0 ? Math.round((successCount / totalSent) * 100) : 0,
    scenarioEnrollments,
    scenarioCompletions,
    scenarioCompletionRate:
      scenarioEnrollments > 0
        ? Math.round((scenarioCompletions / scenarioEnrollments) * 100)
        : 0,
  }
}

/**
 * 일별 발송 추이 (최근 N일)
 */
export async function fetchDailySendTrend(
  supabase: SupabaseClient,
  workspaceId: string,
  days: number = 30
): Promise<DailySendData[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString()

  // 캠페인 메시지 로그
  const { data: msgLogs } = await supabase
    .from('message_logs')
    .select('sent_at')
    .eq('workspace_id', workspaceId)
    .gte('sent_at', sinceStr)
    .in('status', ['sent', 'failed'])

  // 시나리오 로그
  const { data: scenLogs } = await supabase
    .from('scenario_logs')
    .select('sent_at')
    .eq('workspace_id', workspaceId)
    .gte('sent_at', sinceStr)
    .in('status', ['sent', 'failed'])

  // 일별 집계
  const dailyMap = new Map<string, { campaign: number; scenario: number }>()

  // 빈 날짜 채우기
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    dailyMap.set(key, { campaign: 0, scenario: 0 })
  }

  for (const log of msgLogs ?? []) {
    if (!log.sent_at) continue
    const key = log.sent_at.slice(0, 10)
    const entry = dailyMap.get(key)
    if (entry) entry.campaign++
  }

  for (const log of scenLogs ?? []) {
    if (!log.sent_at) continue
    const key = log.sent_at.slice(0, 10)
    const entry = dailyMap.get(key)
    if (entry) entry.scenario++
  }

  return Array.from(dailyMap.entries()).map(([date, counts]) => ({
    date,
    campaign: counts.campaign,
    scenario: counts.scenario,
    total: counts.campaign + counts.scenario,
  }))
}

/**
 * 캠페인별 성과
 */
export async function fetchCampaignPerformances(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<CampaignPerformance[]> {
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, name, message_type, total_count, success_count, fail_count, sent_at')
    .eq('workspace_id', workspaceId)
    .in('status', ['completed', 'failed', 'sending'])
    .order('sent_at', { ascending: false })

  return (campaigns ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    messageType: c.message_type,
    totalCount: c.total_count ?? 0,
    successCount: c.success_count ?? 0,
    failCount: c.fail_count ?? 0,
    successRate:
      (c.total_count ?? 0) > 0
        ? Math.round(((c.success_count ?? 0) / (c.total_count ?? 1)) * 100)
        : 0,
    sentAt: c.sent_at,
  }))
}

/**
 * 시나리오별 성과
 */
export async function fetchScenarioPerformances(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<ScenarioPerformance[]> {
  const { data: scenarios } = await supabase
    .from('scenarios')
    .select('id, name, is_active')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (!scenarios || scenarios.length === 0) return []

  const ids = scenarios.map((s) => s.id)

  const { data: enrollments } = await supabase
    .from('scenario_enrollments')
    .select('scenario_id, status')
    .in('scenario_id', ids)

  const { data: logs } = await supabase
    .from('scenario_logs')
    .select('enrollment_id, status')
    .eq('workspace_id', workspaceId)

  // enrollment → scenario_id 매핑
  const enrollmentScenarioMap = new Map<string, string>()
  const enrollCountMap = new Map<string, number>()
  const completedCountMap = new Map<string, number>()

  for (const e of enrollments ?? []) {
    enrollCountMap.set(e.scenario_id, (enrollCountMap.get(e.scenario_id) ?? 0) + 1)
    if (e.status === 'completed') {
      completedCountMap.set(e.scenario_id, (completedCountMap.get(e.scenario_id) ?? 0) + 1)
    }
  }

  // 시나리오별 enrollment ID 수집
  const { data: enrollmentsWithId } = await supabase
    .from('scenario_enrollments')
    .select('id, scenario_id')
    .in('scenario_id', ids)

  for (const e of enrollmentsWithId ?? []) {
    enrollmentScenarioMap.set(e.id, e.scenario_id)
  }

  const sentCountMap = new Map<string, number>()
  const failedCountMap = new Map<string, number>()

  for (const log of logs ?? []) {
    const scenarioId = enrollmentScenarioMap.get(log.enrollment_id)
    if (!scenarioId) continue
    if (log.status === 'sent') {
      sentCountMap.set(scenarioId, (sentCountMap.get(scenarioId) ?? 0) + 1)
    } else if (log.status === 'failed') {
      failedCountMap.set(scenarioId, (failedCountMap.get(scenarioId) ?? 0) + 1)
    }
  }

  return scenarios.map((s) => {
    const enrollmentCount = enrollCountMap.get(s.id) ?? 0
    const completedCount = completedCountMap.get(s.id) ?? 0
    return {
      id: s.id,
      name: s.name,
      isActive: s.is_active,
      enrollmentCount,
      completedCount,
      completionRate:
        enrollmentCount > 0 ? Math.round((completedCount / enrollmentCount) * 100) : 0,
      totalLogsSent: sentCountMap.get(s.id) ?? 0,
      totalLogsFailed: failedCountMap.get(s.id) ?? 0,
    }
  })
}

/**
 * 메시지 유형별 분포
 */
export async function fetchMessageTypeDistribution(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<MessageTypeDistribution[]> {
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('message_type, total_count')
    .eq('workspace_id', workspaceId)
    .in('status', ['completed', 'failed'])

  const typeMap = new Map<string, number>()

  for (const c of campaigns ?? []) {
    const current = typeMap.get(c.message_type) ?? 0
    typeMap.set(c.message_type, current + (c.total_count ?? 0))
  }

  return Array.from(typeMap.entries())
    .map(([type, count]) => ({
      type,
      label: TYPE_LABELS[type] ?? type,
      count,
    }))
    .sort((a, b) => b.count - a.count)
}
