'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Zap, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import ScenarioTimeline from '@/components/scenarios/ScenarioTimeline'
import EnrollmentTable from '@/components/scenarios/EnrollmentTable'
import type { Scenario, ScenarioStep } from '@/types'

const TRIGGER_LABELS: Record<string, string> = {
  auto_on_create: '자동 (리드 생성 시)',
  manual: '수동',
}

interface EnrollmentRow {
  id: string
  lead_id: string
  current_step: number
  status: string
  enrolled_at: string
  completed_at: string | null
  leads: { name: string; phone: string; email: string | null } | null
}

interface LeadOption {
  id: string
  name: string
  phone: string
}

interface ScenarioDetailClientProps {
  scenario: Scenario
  steps: ScenarioStep[]
  enrollments: EnrollmentRow[]
  leads: LeadOption[]
  triggerGroupName?: string | null
}

export default function ScenarioDetailClient({
  scenario,
  steps,
  enrollments,
  leads,
  triggerGroupName,
}: ScenarioDetailClientProps) {
  const router = useRouter()
  const [enrollModalOpen, setEnrollModalOpen] = useState(false)
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [enrolling, setEnrolling] = useState(false)

  // 이미 등록된 리드 ID
  const enrolledLeadIds = new Set(enrollments.map((e) => e.lead_id))
  const availableLeads = leads.filter((l) => !enrolledLeadIds.has(l.id))

  const handleToggleActive = async (checked: boolean) => {
    const supabase = createClient()
    await supabase
      .from('scenarios')
      .update({ is_active: checked, updated_at: new Date().toISOString() })
      .eq('id', scenario.id)
    router.refresh()
  }

  const handleEnroll = async () => {
    if (selectedLeadIds.length === 0) return
    setEnrolling(true)

    await fetch('/api/leads/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_ids: selectedLeadIds,
        workspace_id: scenario.workspace_id,
      }),
    })

    // 수동 등록이므로 직접 enrollment 생성
    const supabase = createClient()
    const inserts = selectedLeadIds.map((leadId) => ({
      workspace_id: scenario.workspace_id,
      scenario_id: scenario.id,
      lead_id: leadId,
      current_step: 0,
      status: 'active' as const,
    }))

    await supabase
      .from('scenario_enrollments')
      .upsert(inserts, { onConflict: 'scenario_id,lead_id', ignoreDuplicates: true })

    setEnrolling(false)
    setEnrollModalOpen(false)
    setSelectedLeadIds([])
    router.refresh()
  }

  const toggleLead = (leadId: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(leadId)
        ? prev.filter((id) => id !== leadId)
        : [...prev, leadId]
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link href="/scenarios" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900 truncate">{scenario.name}</h2>
            <Zap className={`w-4 h-4 ${scenario.is_active ? 'text-primary' : 'text-gray-300'}`} />
          </div>
          {scenario.description && (
            <p className="text-[14px] text-gray-500 mt-0.5">{scenario.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-gray-400">
            {scenario.is_active ? '활성' : '비활성'}
          </span>
          <Switch
            checked={scenario.is_active}
            onCheckedChange={handleToggleActive}
          />
        </div>
      </div>

      {/* 시나리오 정보 */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
        <h3 className="text-[15px] font-semibold text-gray-900 mb-4">시나리오 정보</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-[12px] text-gray-400">트리거</p>
            <p className="text-[15px] font-semibold text-gray-900 mt-0.5">
              {TRIGGER_LABELS[scenario.trigger_type] ?? scenario.trigger_type}
            </p>
            {(() => {
              const filter = scenario.trigger_filter as any
              if (filter?.group_id && triggerGroupName) {
                return <p className="text-[13px] text-gray-500 mt-0.5">그룹: {triggerGroupName}</p>
              }
              if (filter?.source) {
                return <p className="text-[13px] text-gray-500 mt-0.5">유입경로: {filter.source}</p>
              }
              return null
            })()}
          </div>
          <div>
            <p className="text-[12px] text-gray-400">스텝</p>
            <p className="text-[15px] font-semibold text-gray-900 mt-0.5">{steps.length}개</p>
          </div>
          <div>
            <p className="text-[12px] text-gray-400">등록 리드</p>
            <p className="text-[15px] font-semibold text-gray-900 mt-0.5">{enrollments.length}명</p>
          </div>
        </div>
      </div>

      {/* 타임라인 */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
        <h3 className="text-[15px] font-semibold text-gray-900 mb-4">발송 타임라인</h3>
        <ScenarioTimeline steps={steps} />
      </div>

      {/* 등록 리드 */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-gray-900">
            등록된 리드 ({enrollments.length}명)
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEnrollModalOpen(true)}
            disabled={availableLeads.length === 0}
            className="h-8 px-3 rounded-lg text-[13px] font-semibold border-gray-200 gap-1"
          >
            <UserPlus className="w-3.5 h-3.5" />
            리드 등록
          </Button>
        </div>
        <EnrollmentTable enrollments={enrollments} totalSteps={steps.length} />
      </div>

      {/* 수동 등록 모달 */}
      <Dialog open={enrollModalOpen} onOpenChange={setEnrollModalOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-bold text-gray-900">
              리드 등록
            </DialogTitle>
          </DialogHeader>

          {availableLeads.length === 0 ? (
            <p className="text-[14px] text-gray-400 py-4 text-center">
              등록할 수 있는 리드가 없습니다.
            </p>
          ) : (
            <>
              <div className="max-h-[300px] overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
                {availableLeads.map((lead) => (
                  <label
                    key={lead.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedLeadIds.includes(lead.id)}
                      onCheckedChange={() => toggleLead(lead.id)}
                    />
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-gray-900">{lead.name}</p>
                      <p className="text-[13px] text-gray-400">{lead.phone}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEnrollModalOpen(false)
                    setSelectedLeadIds([])
                  }}
                  className="flex-1 h-10 rounded-lg text-[14px] font-semibold border-gray-200"
                >
                  취소
                </Button>
                <Button
                  onClick={handleEnroll}
                  disabled={selectedLeadIds.length === 0 || enrolling}
                  className="flex-1 h-10 rounded-lg text-[14px] font-semibold bg-primary hover:bg-primary/90"
                >
                  {enrolling ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    `${selectedLeadIds.length}명 등록`
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
