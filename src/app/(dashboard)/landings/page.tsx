import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LandingsClient from './LandingsClient'

export default async function LandingsPage() {
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

  const { data: landings } = await supabase
    .from('landing_forms')
    .select('*, lead_sources(id, title, type)')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  return (
    <LandingsClient
      workspaceId={workspaceId}
      landings={(landings ?? []) as any}
    />
  )
}
