import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ScenarioDetailClient from './ScenarioDetailClient'

interface Props {
  params: Promise<{ scenarioId: string }>
}

export default async function ScenarioDetailPage({ params }: Props) {
  const { scenarioId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: scenario } = await supabase
    .from('scenarios')
    .select('*')
    .eq('id', scenarioId)
    .single()

  if (!scenario) notFound()

  const { data: steps } = await supabase
    .from('scenario_steps')
    .select('*')
    .eq('scenario_id', scenarioId)
    .order('step_order', { ascending: true })

  const { data: enrollments } = await supabase
    .from('scenario_enrollments')
    .select('*, leads:lead_id(name, phone, email)')
    .eq('scenario_id', scenarioId)
    .order('enrolled_at', { ascending: false })

  // 리드 목록 (수동 등록용)
  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, phone')
    .eq('workspace_id', scenario.workspace_id)
    .order('created_at', { ascending: false })

  // 트리거 필터에 그룹이 있으면 그룹명 조회
  let triggerGroupName: string | null = null
  const triggerFilter = scenario.trigger_filter as any
  if (triggerFilter?.group_id) {
    const { data: group } = await supabase
      .from('lead_groups')
      .select('name')
      .eq('id', triggerFilter.group_id)
      .single()
    triggerGroupName = group?.name ?? null
  }

  return (
    <ScenarioDetailClient
      scenario={scenario}
      steps={steps ?? []}
      enrollments={enrollments ?? []}
      leads={leads ?? []}
      triggerGroupName={triggerGroupName}
    />
  )
}
