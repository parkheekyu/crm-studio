import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LeadFormCreateClient from './LeadFormCreateClient'

export default async function LeadFormCreatePage() {
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

  return <LeadFormCreateClient workspaceId={workspaceId} groups={groups ?? []} />
}
