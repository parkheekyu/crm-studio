import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChargeClient from './ChargeClient'

export default async function ChargePage() {
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

  const { data: credit } = await supabase
    .from('workspace_credits')
    .select('balance')
    .eq('workspace_id', workspaceId)
    .single()

  return (
    <ChargeClient
      workspaceId={workspaceId}
      balance={credit?.balance ?? 0}
      userEmail={user.email ?? ''}
      userName={user.user_metadata?.full_name ?? user.email ?? ''}
    />
  )
}
