import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Users, Send, CheckCircle2, Zap } from 'lucide-react'

interface DashboardStats {
  leadCount: number
  totalSent: number
  successRate: number
  scenarioCompletionRate: number
  scenarioCompletions: number
  scenarioEnrollments: number
}

function getStats(stats: DashboardStats) {
  return [
    {
      label: '총 리드',
      value: String(stats.leadCount),
      sub: '등록된 리드 수',
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      label: '발송 메시지',
      value: stats.totalSent.toLocaleString(),
      sub: '캠페인 + 시나리오',
      icon: Send,
      color: 'text-violet-500',
      bg: 'bg-violet-50',
    },
    {
      label: '성공률',
      value: `${stats.successRate}%`,
      sub: '전체 발송 기준',
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
    },
    {
      label: '시나리오 완료율',
      value: `${stats.scenarioCompletionRate}%`,
      sub: `${stats.scenarioCompletions} / ${stats.scenarioEnrollments}명`,
      icon: Zap,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
    },
  ]
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // 워크스페이스 없으면 온보딩으로
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)

  if (!memberships || memberships.length === 0) {
    redirect('/workspace/new')
  }

  const workspaceId = memberships[0].workspace_id

  // 리드 카운트 조회
  const { count: leadCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)

  // 캠페인 발송 집계
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('total_count, success_count, fail_count')
    .eq('workspace_id', workspaceId)
    .in('status', ['completed', 'failed'])

  let totalSent = 0
  let successCount = 0
  for (const c of campaigns ?? []) {
    totalSent += c.total_count ?? 0
    successCount += c.success_count ?? 0
  }

  // 시나리오 로그 집계
  const { data: scenarioLogs } = await supabase
    .from('scenario_logs')
    .select('status')
    .eq('workspace_id', workspaceId)

  for (const log of scenarioLogs ?? []) {
    totalSent++
    if (log.status === 'sent') successCount++
  }

  // 시나리오 enrollment 집계
  const { data: enrollments } = await supabase
    .from('scenario_enrollments')
    .select('status')
    .eq('workspace_id', workspaceId)

  const scenarioEnrollments = enrollments?.length ?? 0
  const scenarioCompletions = enrollments?.filter((e) => e.status === 'completed').length ?? 0

  const dashboardStats: DashboardStats = {
    leadCount: leadCount ?? 0,
    totalSent,
    successRate: totalSent > 0 ? Math.round((successCount / totalSent) * 100) : 0,
    scenarioCompletionRate: scenarioEnrollments > 0 ? Math.round((scenarioCompletions / scenarioEnrollments) * 100) : 0,
    scenarioCompletions,
    scenarioEnrollments,
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? '사용자'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 웰컴 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          안녕하세요, {firstName}님 👋
        </h2>
        <p className="mt-1 text-[16px] text-gray-500">
          CRM Studio 대시보드에 오신 걸 환영합니다.
        </p>
      </div>

      {/* 스탯 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {getStats(dashboardStats).map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
            >
              <div
                className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${stat.bg} mb-3`}
              >
                <Icon className={`w-4.5 h-4.5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-[14px] font-medium text-gray-700 mt-0.5">
                {stat.label}
              </p>
              <p className="text-[12px] text-muted-foreground mt-1">
                {stat.sub}
              </p>
            </div>
          )
        })}
      </div>

      {/* Phase 로드맵 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-[16px] font-semibold text-gray-900 mb-4">
          구축 로드맵
        </h3>
        <div className="space-y-3">
          {[
            { phase: 'Phase 1', label: '인증 + 워크스페이스 + 대시보드', done: true },
            { phase: 'Phase 2', label: '리드 수집 (랜딩 빌더, 폼, CSV 업로드)', done: true },
            { phase: 'Phase 3', label: 'CRM 시나리오 빌더 + Solapi 발송', done: true },
            { phase: 'Phase 4', label: '발송 로그 + 성과 분석 대시보드', done: true },
          ].map((item) => (
            <div key={item.phase} className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[12px] font-bold ${
                  item.done
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {item.done ? '✓' : ''}
              </div>
              <div>
                <span
                  className={`text-[12px] font-semibold ${
                    item.done ? 'text-primary' : 'text-gray-400'
                  }`}
                >
                  {item.phase}
                </span>
                <span
                  className={`ml-2 text-[14px] ${
                    item.done ? 'text-gray-900 font-medium' : 'text-gray-400'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
