import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FacebookConfigClient from './FacebookConfigClient'

export default async function FacebookConfigPage() {
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
  const { data: groups } = await supabase
    .from('lead_groups')
    .select('id, name, color')
    .eq('workspace_id', workspaceId)
    .order('name')

  return <FacebookConfigClient workspaceId={workspaceId} groups={groups ?? []} />
}
