import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LandingEditClient from './LandingEditClient'

export default async function LandingEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: landing } = await supabase
    .from('landing_forms')
    .select('*')
    .eq('id', id)
    .single()

  if (!landing) notFound()

  const { data: formSources } = await supabase
    .from('lead_sources')
    .select('id, title')
    .eq('workspace_id', landing.workspace_id)
    .eq('type', 'form')
    .eq('is_active', true)
    .order('title')

  const { data: existingLandings } = await supabase
    .from('landing_forms')
    .select('id, title, slug')
    .eq('workspace_id', landing.workspace_id)
    .eq('is_active', true)
    .neq('id', id)
    .order('title')

  return (
    <LandingEditClient
      landing={landing as any}
      formSources={formSources ?? []}
      existingLandings={existingLandings ?? []}
    />
  )
}
