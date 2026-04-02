import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LeadSourceEditClient from './LeadSourceEditClient'

export default async function LeadSourceEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: source } = await supabase
    .from('lead_sources')
    .select('*')
    .eq('id', id)
    .single()

  if (!source) notFound()

  const { data: groups } = await supabase
    .from('lead_groups')
    .select('id, name, color')
    .eq('workspace_id', source.workspace_id)
    .order('name')

  return <LeadSourceEditClient source={source} groups={groups ?? []} />
}
