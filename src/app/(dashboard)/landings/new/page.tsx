import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LandingCreateClient from './LandingCreateClient'

export default async function LandingCreatePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)

  if (!memberships || memberships.length === 0) redirect('/workspace/new')

  const workspaceId = memberships[0].workspace_id

  // 연결 가능한 리드폼 목록
  const { data: formSources } = await supabase
    .from('lead_sources')
    .select('id, title')
    .eq('workspace_id', workspaceId)
    .eq('type', 'form')
    .eq('is_active', true)
    .order('title')

  // 기존 랜딩 목록 (감사 페이지 선택용)
  const { data: existingLandings } = await supabase
    .from('landing_forms')
    .select('id, title, slug')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .order('title')

  return (
    <LandingCreateClient
      workspaceId={workspaceId}
      formSources={formSources ?? []}
      existingLandings={existingLandings ?? []}
    />
  )
}
