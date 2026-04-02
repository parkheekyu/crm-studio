'use client'

import Link from 'next/link'
import { Zap, ArrowRight } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import type { Scenario } from '@/types'

const TRIGGER_LABELS: Record<string, string> = {
  auto_on_create: '자동 (리드 생성 시)',
  manual: '수동',
}

interface ScenarioCardProps {
  scenario: Scenario
  stepCount: number
  enrollmentCount: number
  onToggle: () => void
}

export default function ScenarioCard({
  scenario,
  stepCount,
  enrollmentCount,
  onToggle,
}: ScenarioCardProps) {
  const handleToggle = async (checked: boolean) => {
    const supabase = createClient()
    await supabase
      .from('scenarios')
      .update({ is_active: checked, updated_at: new Date().toISOString() })
      .eq('id', scenario.id)
    onToggle()
  }

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <Link href={`/scenarios/${scenario.id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${scenario.is_active ? 'bg-primary/10' : 'bg-gray-100'}`}>
              <Zap className={`w-4 h-4 ${scenario.is_active ? 'text-primary' : 'text-gray-400'}`} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold text-gray-900 truncate">
                {scenario.name}
              </h3>
              {scenario.description && (
                <p className="text-[13px] text-gray-400 mt-0.5 truncate">
                  {scenario.description}
                </p>
              )}
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-3 ml-4">
          <Switch
            checked={scenario.is_active}
            onCheckedChange={handleToggle}
          />
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-4 text-[13px] text-gray-400">
        <span>{TRIGGER_LABELS[scenario.trigger_type] ?? scenario.trigger_type}</span>
        <span>{stepCount}개 스텝</span>
        <span>{enrollmentCount}명 등록</span>
        <Link
          href={`/scenarios/${scenario.id}`}
          className="ml-auto flex items-center gap-1 text-primary hover:text-primary/80 font-medium"
        >
          상세 <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
