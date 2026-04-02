import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GroupsClient from './GroupsClient'

export default async function GroupsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
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

  const { data: groups } = await supabase
    .from('lead_groups')
    .select('*, lead_group_memberships(count)')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  return (
    <GroupsClient
      workspaceId={workspaceId}
      groups={
        (groups ?? []).map((g) => ({
          ...g,
          memberCount:
            (g.lead_group_memberships as any)?.[0]?.count ?? 0,
        }))
      }
    />
  )
}
