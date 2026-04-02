import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CampaignDetailClient from './CampaignDetailClient'

interface Props {
  params: Promise<{ campaignId: string }>
}

export default async function CampaignDetailPage({ params }: Props) {
  const { campaignId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (!campaign) notFound()

  const { data: logs } = await supabase
    .from('message_logs')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: true })

  return (
    <CampaignDetailClient
      campaign={campaign}
      logs={logs ?? []}
    />
  )
}
