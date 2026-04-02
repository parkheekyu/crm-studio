import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CampaignsClient from './CampaignsClient'

export default async function CampaignsPage() {
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

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  return (
    <CampaignsClient
      workspaceId={workspaceId}
      campaigns={campaigns ?? []}
    />
  )
}
