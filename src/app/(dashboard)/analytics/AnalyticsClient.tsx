'use client'

import { Send, CheckCircle2, XCircle, Zap } from 'lucide-react'
import StatCard from '@/components/analytics/StatCard'
import DailySendChart from '@/components/analytics/DailySendChart'
import MessageTypeChart from '@/components/analytics/MessageTypeChart'
import CampaignTable from '@/components/analytics/CampaignTable'
import ScenarioTable from '@/components/analytics/ScenarioTable'
import type {
  AnalyticsSummary,
  DailySendData,
  CampaignPerformance,
  ScenarioPerformance,
  MessageTypeDistribution,
} from '@/types/analytics'

interface AnalyticsClientProps {
  summary: AnalyticsSummary
  dailyTrend: DailySendData[]
  campaigns: CampaignPerformance[]
  scenarios: ScenarioPerformance[]
  messageTypes: MessageTypeDistribution[]
}

export default function AnalyticsClient({
  summary,
  dailyTrend,
  campaigns,
  scenarios,
  messageTypes,
}: AnalyticsClientProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">성과 분석</h2>
        <p className="mt-1 text-[13px] text-gray-500">캠페인 및 시나리오 발송 성과를 확인하세요.</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Send className="w-5 h-5 text-violet-500" />}
          iconBg="bg-violet-50"
          label="총 발송"
          value={summary.totalSent.toLocaleString()}
          sub={`성공 ${summary.successCount.toLocaleString()} / 실패 ${summary.failCount.toLocaleString()}`}
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
          iconBg="bg-green-50"
          label="성공률"
          value={`${summary.successRate}%`}
        />
        <StatCard
          icon={<XCircle className="w-5 h-5 text-red-500" />}
          iconBg="bg-red-50"
          label="실패 수"
          value={summary.failCount.toLocaleString()}
        />
        <StatCard
          icon={<Zap className="w-5 h-5 text-primary" />}
          iconBg="bg-blue-50"
          label="시나리오 완료율"
          value={`${summary.scenarioCompletionRate}%`}
          sub={`${summary.scenarioCompletions} / ${summary.scenarioEnrollments}명`}
        />
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 일별 발송 추이 */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-[14px] font-semibold text-gray-900 mb-4">일별 발송 추이</h3>
          <DailySendChart data={dailyTrend} />
        </div>

        {/* 메시지 유형 분포 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-[14px] font-semibold text-gray-900 mb-4">메시지 유형 분포</h3>
          <MessageTypeChart data={messageTypes} />
        </div>
      </div>

      {/* 캠페인별 성과 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h3 className="text-[14px] font-semibold text-gray-900">
            캠페인별 성과 ({campaigns.length}개)
          </h3>
        </div>
        <CampaignTable campaigns={campaigns} />
      </div>

      {/* 시나리오별 성과 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h3 className="text-[14px] font-semibold text-gray-900">
            시나리오별 성과 ({scenarios.length}개)
          </h3>
        </div>
        <ScenarioTable scenarios={scenarios} />
      </div>
    </div>
  )
}
