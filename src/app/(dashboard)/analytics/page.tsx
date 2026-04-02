import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  fetchAnalyticsSummary,
  fetchDailySendTrend,
  fetchCampaignPerformances,
  fetchScenarioPerformances,
  fetchMessageTypeDistribution,
} from '@/lib/analytics/fetch-analytics'
import AnalyticsClient from './AnalyticsClient'

export default async function AnalyticsPage() {
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

  const [summary, dailyTrend, campaigns, scenarios, messageTypes] = await Promise.all([
    fetchAnalyticsSummary(supabase, workspaceId),
    fetchDailySendTrend(supabase, workspaceId),
    fetchCampaignPerformances(supabase, workspaceId),
    fetchScenarioPerformances(supabase, workspaceId),
    fetchMessageTypeDistribution(supabase, workspaceId),
  ])

  return (
    <AnalyticsClient
      summary={summary}
      dailyTrend={dailyTrend}
      campaigns={campaigns}
      scenarios={scenarios}
      messageTypes={messageTypes}
    />
  )
}
