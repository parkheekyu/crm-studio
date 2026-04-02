import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FormCreateClient from './FormCreateClient'

export default async function FormNewPage() {
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

  return <FormCreateClient workspaceId={memberships[0].workspace_id} />
}
