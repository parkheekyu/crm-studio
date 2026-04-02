'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, LayoutList, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ScenarioCard from '@/components/scenarios/ScenarioCard'
import ScenarioCalendar from '@/components/scenarios/ScenarioCalendar'
import type { Scenario, ScenarioStep } from '@/types'

interface ScenariosClientProps {
  workspaceId: string
  scenarios: Scenario[]
  steps: ScenarioStep[]
  stepCounts: Record<string, number>
  enrollmentCounts: Record<string, number>
}

export default function ScenariosClient({
  workspaceId,
  scenarios,
  steps,
  stepCounts,
  enrollmentCounts,
}: ScenariosClientProps) {
  const router = useRouter()
  const [view, setView] = useState<'list' | 'calendar'>('list')

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">시나리오</h2>
          <p className="mt-1 text-[13px] text-gray-500">총 {scenarios.length}개</p>
        </div>
        <div className="flex items-center gap-2">
          {/* 뷰 토글 */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setView('list')}
              className={`h-8 px-2.5 rounded-md flex items-center gap-1.5 text-[13px] font-medium transition-colors ${
                view === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              목록
            </button>
            <button
              type="button"
              onClick={() => setView('calendar')}
              className={`h-8 px-2.5 rounded-md flex items-center gap-1.5 text-[13px] font-medium transition-colors ${
                view === 'calendar'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              캘린더
            </button>
          </div>

          <Link href="/scenarios/new">
            <Button className="h-10 px-4 rounded-xl text-[13px] font-semibold bg-primary hover:bg-primary/90 gap-1.5">
              <Plus className="w-4 h-4" />
              새 시나리오
            </Button>
          </Link>
        </div>
      </div>

      {scenarios.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-[14px] text-gray-400">아직 시나리오가 없습니다.</p>
          <p className="text-[13px] text-gray-400 mt-1">
            리드가 등록되면 자동으로 메시지를 보내는 시나리오를 만들어 보세요.
          </p>
        </div>
      ) : view === 'list' ? (
        <div className="grid gap-4">
          {scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              stepCount={stepCounts[scenario.id] ?? 0}
              enrollmentCount={enrollmentCounts[scenario.id] ?? 0}
              onToggle={() => router.refresh()}
            />
          ))}
        </div>
      ) : (
        <ScenarioCalendar scenarios={scenarios} steps={steps} />
      )}
    </div>
  )
}
