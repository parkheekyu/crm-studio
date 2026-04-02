import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ApiKeyManager from '@/components/settings/ApiKeyManager'

export default async function ApiKeysPage() {
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

  const { data: apiKeys } = await supabase
    .from('workspace_api_keys')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  return (
    <ApiKeyManager
      workspaceId={workspaceId}
      initialKeys={apiKeys ?? []}
    />
  )
}
