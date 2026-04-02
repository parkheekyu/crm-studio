import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ScenarioCreateClient from './ScenarioCreateClient'

export default async function ScenarioNewPage() {
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

  // Solapi 연동 확인
  const { data: integration } = await supabase
    .from('workspace_integrations')
    .select('config')
    .eq('workspace_id', workspaceId)
    .eq('provider', 'solapi')
    .single()

  const hasIntegration = !!(integration?.config as any)?.api_key

  // 유입경로 목록 (트리거 필터용)
  const { data: leads } = await supabase
    .from('leads')
    .select('source')
    .eq('workspace_id', workspaceId)

  const sources = [...new Set((leads ?? []).map((l) => l.source).filter(Boolean))] as string[]

  // 그룹 목록 (트리거 필터용)
  const { data: groups } = await supabase
    .from('lead_groups')
    .select('id, name, color')
    .eq('workspace_id', workspaceId)
    .order('name')

  return (
    <ScenarioCreateClient
      workspaceId={workspaceId}
      hasIntegration={hasIntegration}
      sources={sources}
      groups={groups ?? []}
    />
  )
}
