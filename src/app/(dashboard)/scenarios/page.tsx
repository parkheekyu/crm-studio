import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ScenariosClient from './ScenariosClient'
import type { ScenarioStep } from '@/types'

export default async function ScenariosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)

  if (!memberships || memberships.length === 0) {
    redirect('/workspace/new')
  }

  const workspaceId = memberships[0].workspace_id

  // 시나리오 목록 + 스텝 수 + 등록 리드 수
  const { data: scenarios } = await supabase
    .from('scenarios')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  // 각 시나리오별 스텝 수, enrollment 수 조회
  const scenarioIds = (scenarios ?? []).map((s) => s.id)

  let stepCounts: Record<string, number> = {}
  let enrollmentCounts: Record<string, number> = {}
  let allSteps: ScenarioStep[] = []

  if (scenarioIds.length > 0) {
    const { data: steps } = await supabase
      .from('scenario_steps')
      .select('*')
      .in('scenario_id', scenarioIds)
      .order('step_order', { ascending: true })

    allSteps = steps ?? []

    for (const step of allSteps) {
      stepCounts[step.scenario_id] = (stepCounts[step.scenario_id] ?? 0) + 1
    }

    const { data: enrollments } = await supabase
      .from('scenario_enrollments')
      .select('scenario_id')
      .in('scenario_id', scenarioIds)

    for (const e of enrollments ?? []) {
      enrollmentCounts[e.scenario_id] = (enrollmentCounts[e.scenario_id] ?? 0) + 1
    }
  }

  return (
    <ScenariosClient
      workspaceId={workspaceId}
      scenarios={scenarios ?? []}
      steps={allSteps ?? []}
      stepCounts={stepCounts}
      enrollmentCounts={enrollmentCounts}
    />
  )
}
