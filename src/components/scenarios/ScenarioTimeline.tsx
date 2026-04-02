'use client'

import { MessageSquare } from 'lucide-react'
import { detectMessageType, getByteLength } from '@/lib/campaigns/variables'
import type { ScenarioStep } from '@/types'

interface ScenarioTimelineProps {
  steps: ScenarioStep[]
}

export default function ScenarioTimeline({ steps }: ScenarioTimelineProps) {
  if (steps.length === 0) {
    return (
      <div className="text-center py-8 text-[14px] text-gray-400">
        등록된 스텝이 없습니다.
      </div>
    )
  }

  return (
    <div className="relative pl-8">
      {/* 세로 연결선 */}
      {steps.length > 1 && (
        <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gray-100" />
      )}

      <div className="space-y-3">
        {steps.map((step, i) => {
          const msgType = detectMessageType(step.message_content)
          const bytes = getByteLength(step.message_content)

          return (
            <div key={step.id} className="relative">
              {/* 타임라인 도트 */}
              <div className="absolute -left-8 top-3.5 w-[14px] h-[14px] rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              </div>

              {/* 스텝 카드 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[13px] font-bold text-primary">
                    D+{step.delay_days}
                  </span>
                  <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                    msgType === 'SMS'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-orange-50 text-orange-600'
                  }`}>
                    {msgType}
                  </span>
                  <span className="text-[11px] text-gray-400">{bytes}B</span>
                </div>
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-gray-300 mt-0.5 flex-shrink-0" />
                  <p className="text-[14px] text-gray-600 whitespace-pre-wrap line-clamp-3">
                    {step.message_content}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
