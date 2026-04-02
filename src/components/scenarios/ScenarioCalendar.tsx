'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Scenario, ScenarioStep } from '@/types'

interface ScenarioCalendarProps {
  scenarios: Scenario[]
  steps: ScenarioStep[]
}

const MESSAGE_TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  SMS: { label: 'SMS', cls: 'bg-blue-50 text-blue-600' },
  ALIMTALK: { label: '알림톡', cls: 'bg-amber-50 text-amber-600' },
  FRIENDTALK: { label: '브랜드', cls: 'bg-yellow-50 text-yellow-700' },
  EMAIL: { label: '이메일', cls: 'bg-green-50 text-green-600' },
}

export default function ScenarioCalendar({ scenarios, steps }: ScenarioCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const scenarioMap = useMemo(() => {
    const map: Record<string, Scenario> = {}
    for (const s of scenarios) map[s.id] = s
    return map
  }, [scenarios])

  // scheduled_at이 있는 스텝들을 날짜별로 그룹핑
  const stepsByDate = useMemo(() => {
    const map: Record<string, (ScenarioStep & { scenarioName: string })[]> = {}
    for (const step of steps) {
      if (!step.scheduled_at) continue
      const dateKey = step.scheduled_at.slice(0, 10) // YYYY-MM-DD
      if (!map[dateKey]) map[dateKey] = []
      map[dateKey].push({
        ...step,
        scenarioName: scenarioMap[step.scenario_id]?.name ?? '시나리오',
      })
    }
    return map
  }, [steps, scenarioMap])

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToday = () => setCurrentDate(new Date())

  // 달력 그리드 계산
  const firstDay = new Date(year, month, 1).getDay() // 0=일
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const weeks: (number | null)[][] = []
  let week: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }

  const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h3 className="text-[16px] font-bold text-gray-900">
            {year}년 {month + 1}월
          </h3>
          <button
            type="button"
            onClick={goToday}
            className="h-7 px-2.5 rounded-md text-[12px] font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            오늘
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={`py-2.5 text-center text-[12px] font-semibold ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="divide-y divide-gray-50">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 divide-x divide-gray-50">
            {week.map((day, di) => {
              if (day === null) {
                return <div key={`empty-${di}`} className="min-h-[100px] bg-gray-50/30" />
              }

              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const daySteps = stepsByDate[dateStr] ?? []
              const isToday = dateStr === todayStr
              const isPast = dateStr < todayStr
              const dayOfWeek = new Date(year, month, day).getDay()

              return (
                <div
                  key={day}
                  className={`min-h-[100px] p-1.5 transition-colors ${
                    isPast ? 'bg-gray-50/50' : 'bg-white'
                  }`}
                >
                  {/* 날짜 */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-semibold ${
                        isToday
                          ? 'bg-primary text-white'
                          : dayOfWeek === 0
                            ? 'text-red-400'
                            : dayOfWeek === 6
                              ? 'text-blue-400'
                              : 'text-gray-700'
                      }`}
                    >
                      {day}
                    </span>
                    {daySteps.length > 0 && (
                      <span className="text-[10px] font-medium text-gray-400">
                        {daySteps.length}건
                      </span>
                    )}
                  </div>

                  {/* 스텝 목록 */}
                  <div className="space-y-0.5">
                    {daySteps.slice(0, 3).map((step) => {
                      const badge = MESSAGE_TYPE_BADGE[step.message_type] ?? MESSAGE_TYPE_BADGE.SMS
                      const time = step.scheduled_at
                        ? new Date(step.scheduled_at).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''

                      return (
                        <Link
                          key={step.id}
                          href={`/scenarios/${step.scenario_id}`}
                          className="block rounded-md px-1.5 py-1 hover:bg-gray-100 transition-colors group"
                        >
                          <div className="flex items-center gap-1">
                            <span className={`shrink-0 text-[9px] font-semibold px-1 py-px rounded ${badge.cls}`}>
                              {badge.label}
                            </span>
                            <span className="text-[11px] text-gray-700 truncate group-hover:text-primary transition-colors">
                              {step.scenarioName}
                            </span>
                          </div>
                          {time && (
                            <p className="text-[10px] text-gray-400 ml-0.5 mt-px">{time}</p>
                          )}
                        </Link>
                      )
                    })}
                    {daySteps.length > 3 && (
                      <p className="text-[10px] text-gray-400 pl-1.5">
                        +{daySteps.length - 3}건 더
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
