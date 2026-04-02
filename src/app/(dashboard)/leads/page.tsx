import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LeadsClient from './LeadsClient'

export default async function LeadsPage() {
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

  // 리드 목록 + 그룹 멤버십 join
  const { data: leads } = await supabase
    .from('leads')
    .select('*, lead_group_memberships(lead_groups(id, name, color))')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  // 전체 그룹 목록 (필터 + 할당용)
  const { data: groups } = await supabase
    .from('lead_groups')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('name')

  // 폼 제목 목록 (유입경로 선택용)
  const { data: forms } = await supabase
    .from('landing_forms')
    .select('title')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .order('title')

  const formTitles = [...new Set((forms ?? []).map((f) => f.title))]

  // 리드에 그룹 정보 플래턴
  const leadsWithGroups = (leads ?? []).map((lead) => {
    const memberships = (lead.lead_group_memberships ?? []) as any[]
    const groupList = memberships
      .map((m: any) => m.lead_groups)
      .filter(Boolean)
    return { ...lead, groups: groupList, lead_group_memberships: undefined }
  })

  return (
    <LeadsClient
      workspaceId={workspaceId}
      leads={leadsWithGroups as any}
      groups={groups ?? []}
      formTitles={formTitles}
    />
  )
}
