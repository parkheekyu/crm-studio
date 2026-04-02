import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CampaignCreateClient from './CampaignCreateClient'

export default async function CampaignNewPage() {
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

  // 리드 목록
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  // 그룹 목록
  const { data: groups } = await supabase
    .from('lead_groups')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('name')

  return (
    <CampaignCreateClient
      workspaceId={workspaceId}
      leads={(leads ?? []) as any}
      groups={(groups ?? []) as any}
      hasIntegration={hasIntegration}
    />
  )
}
