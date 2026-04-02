import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CollectClient from './CollectClient'

export default async function CollectPage() {
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

  const { data: sources } = await supabase
    .from('lead_sources')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  const { data: groups } = await supabase
    .from('lead_groups')
    .select('id, name, color')
    .eq('workspace_id', workspaceId)

  // group lookup map
  const groupMap = Object.fromEntries((groups ?? []).map((g) => [g.id, g]))

  return (
    <CollectClient
      workspaceId={workspaceId}
      sources={sources ?? []}
      groupMap={groupMap}
    />
  )
}
