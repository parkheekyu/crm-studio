export interface AnalyticsSummary {
  totalSent: number
  successCount: number
  failCount: number
  successRate: number
  scenarioEnrollments: number
  scenarioCompletions: number
  scenarioCompletionRate: number
}

export interface DailySendData {
  date: string // 'YYYY-MM-DD'
  campaign: number
  scenario: number
  total: number
}

export interface CampaignPerformance {
  id: string
  name: string
  messageType: string
  totalCount: number
  successCount: number
  failCount: number
  successRate: number
  sentAt: string | null
}

export interface ScenarioPerformance {
  id: string
  name: string
  isActive: boolean
  enrollmentCount: number
  completedCount: number
  completionRate: number
  totalLogsSent: number
  totalLogsFailed: number
}

export interface MessageTypeDistribution {
  type: string
  label: string
  count: number
}
