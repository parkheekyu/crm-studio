'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, AlertTriangle, Settings, Trash2, MessageSquare, LayoutList, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type StepData, type VariableBinding, type StepTargetFilter } from '@/components/scenarios/StepEditor'
import VariableBindingBox from '@/components/scenarios/VariableBindingBox'
import { detectMessageType, extractVariables } from '@/lib/campaigns/variables'

const MESSAGE_TYPES = [
  { value: 'SMS', label: 'SMS', badgeCls: 'bg-blue-50 text-blue-600' },
  { value: 'ALIMTALK', label: '알림톡', badgeCls: 'bg-amber-50 text-amber-600' },
  { value: 'FRIENDTALK', label: '친구톡(브랜드)', badgeCls: 'bg-yellow-50 text-yellow-700' },
  { value: 'EMAIL', label: '이메일', badgeCls: 'bg-green-50 text-green-600' },
] as const

function getTypeBadge(type: string) {
  return MESSAGE_TYPES.find((t) => t.value === type) ?? MESSAGE_TYPES[0]
}

interface AlimtalkTemplate {
  templateId: string
  name: string
  content: string
  status: string
  pfId?: string
  [key: string]: any
}

interface KakaoChannel {
  pfId: string
  searchId: string
  channelName: string
}

interface GroupOption {
  id: string
  name: string
  color: string | null
}

interface ScenarioCreateClientProps {
  workspaceId: string
  hasIntegration: boolean
  sources: string[]
  groups?: GroupOption[]
}

/* ── 캘린더 뷰 (일괄 발송 전용) ── */
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function ScheduledCalendarView({
  steps,
  selectedStep,
  calendarDate,
  setCalendarDate,
  onSelectStep,
  onAddStep,
}: {
  steps: StepData[]
  selectedStep: number
  calendarDate: Date
  setCalendarDate: (d: Date) => void
  onSelectStep: (i: number) => void
  onAddStep: () => void
}) {
  const year = calendarDate.getFullYear()
  const month = calendarDate.getMonth()
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // 스텝을 날짜별로 그룹핑
  const stepsByDate: Record<string, { step: StepData; index: number }[]> = {}
  for (let i = 0; i < steps.length; i++) {
    const sa = steps[i].scheduled_at
    if (!sa) continue
    const dateKey = sa.slice(0, 10)
    if (!stepsByDate[dateKey]) stepsByDate[dateKey] = []
    stepsByDate[dateKey].push({ step: steps[i], index: i })
  }

  // 달력 그리드
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weeks: (number | null)[][] = []
  let week: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d)
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }

  return (
    <div>
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[14px] font-bold text-gray-900">
          {year}년 {month + 1}월
        </h4>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCalendarDate(new Date())}
            className="h-6 px-2 rounded text-[11px] font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors mr-1"
          >
            오늘
          </button>
          <button
            type="button"
            onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <button
            type="button"
            onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={`py-1.5 text-center text-[11px] font-semibold ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="border border-gray-100 rounded-lg overflow-hidden divide-y divide-gray-100">
        {weeks.map((w, wi) => (
          <div key={wi} className="grid grid-cols-7 divide-x divide-gray-100">
            {w.map((day, di) => {
              if (day === null) {
                return <div key={`e-${di}`} className="min-h-[72px] bg-gray-50/40" />
              }
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const daySteps = stepsByDate[dateStr] ?? []
              const isToday = dateStr === todayStr
              const dayOfWeek = new Date(year, month, day).getDay()

              return (
                <div key={day} className="min-h-[72px] p-1">
                  <span
                    className={`w-5 h-5 flex items-center justify-center rounded-full text-[11px] font-semibold mb-0.5 ${
                      isToday
                        ? 'bg-primary text-white'
                        : dayOfWeek === 0
                          ? 'text-red-400'
                          : dayOfWeek === 6
                            ? 'text-blue-400'
                            : 'text-gray-600'
                    }`}
                  >
                    {day}
                  </span>
                  <div className="space-y-0.5">
                    {daySteps.map(({ step, index }) => {
                      const isActive = selectedStep === index
                      const badge = getTypeBadge(step.message_type)
                      const time = step.scheduled_at
                        ? new Date(step.scheduled_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                        : ''
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => onSelectStep(index)}
                          className={`w-full text-left rounded px-1 py-0.5 transition-colors ${
                            isActive
                              ? 'bg-primary/10 ring-1 ring-primary/30'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <span className={`text-[9px] font-semibold px-1 rounded ${badge.badgeCls}`}>
                              {badge.label}
                            </span>
                            {time && (
                              <span className="text-[10px] text-gray-400">{time}</span>
                            )}
                          </div>
                          {step.message_content && (
                            <p className="text-[10px] text-gray-500 truncate mt-px">
                              {step.message_content.slice(0, 20)}
                            </p>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* 스텝 추가 버튼 */}
      <button
        type="button"
        onClick={onAddStep}
        className="w-full flex items-center justify-center gap-1.5 h-9 mt-3 rounded-lg border border-dashed border-gray-200 text-[13px] font-semibold text-gray-400 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        스텝 추가
      </button>
    </div>
  )
}

export default function ScenarioCreateClient({
  workspaceId,
  hasIntegration,
  sources,
  groups = [],
}: ScenarioCreateClientProps) {
  const router = useRouter()
  const [scenarioType, setScenarioType] = useState<'sequential' | 'scheduled'>('sequential')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [triggerType, setTriggerType] = useState('auto_on_create')
  const [filterType, setFilterType] = useState<'none' | 'source' | 'group'>('none')
  const [triggerSource, setTriggerSource] = useState('')
  const [triggerGroupId, setTriggerGroupId] = useState('')
  const [sendTime, setSendTime] = useState('09:00')
  const [steps, setSteps] = useState<StepData[]>([
    { delay_days: 0, message_type: 'SMS', message_content: '' },
  ])
  const [selectedStep, setSelectedStep] = useState(0)
  const [stepView, setStepView] = useState<'timeline' | 'calendar'>('timeline')
  const [calendarDate, setCalendarDate] = useState(() => new Date())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alimtalkTemplates, setAlimtalkTemplates] = useState<AlimtalkTemplate[]>([])
  const [kakaoChannels, setKakaoChannels] = useState<KakaoChannel[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)

  // Solapi 알림톡 템플릿 목록 로드
  useEffect(() => {
    if (!hasIntegration) return
    setTemplatesLoading(true)
    fetch(`/api/integrations/solapi/templates?workspace_id=${workspaceId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.templates) {
          setAlimtalkTemplates(data.templates)
        }
        if (data.channels) {
          setKakaoChannels(data.channels)
        }
      })
      .catch(() => {})
      .finally(() => setTemplatesLoading(false))
  }, [workspaceId, hasIntegration])

  // 카카오 채널이 1개면 알림톡 스텝에 자동 선택
  useEffect(() => {
    if (kakaoChannels.length !== 1) return
    const pfId = kakaoChannels[0].pfId
    const step = steps[selectedStep]
    if ((step?.message_type === 'ALIMTALK' || step?.message_type === 'FRIENDTALK') && !step.kakao_options?.pf_id) {
      updateStep(selectedStep, { ...step, kakao_options: { pf_id: pfId } })
    }
  }, [kakaoChannels, selectedStep, steps[selectedStep]?.message_type])

  const addStep = () => {
    if (scenarioType === 'scheduled') {
      // 캘린더 뷰에서는 오늘 날짜+09:00으로 기본 설정
      const now = new Date()
      const defaultScheduledAt = stepView === 'calendar'
        ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T09:00`
        : ''
      const newSteps = [...steps, {
        delay_days: 0,
        message_type: 'SMS',
        message_content: '',
        scheduled_at: defaultScheduledAt,
        target_filter: { type: 'all' as const },
      }]
      setSteps(newSteps)
      setSelectedStep(newSteps.length - 1)
    } else {
      const lastDay = steps.length > 0 ? steps[steps.length - 1].delay_days : 0
      const newSteps = [...steps, { delay_days: lastDay + 1, message_type: 'SMS', message_content: '' }]
      setSteps(newSteps)
      setSelectedStep(newSteps.length - 1)
    }
  }

  const updateStep = (index: number, step: StepData) => {
    const newSteps = [...steps]
    newSteps[index] = step
    setSteps(newSteps)
  }

  const insertStepAt = (afterIndex: number) => {
    const prevStep = steps[afterIndex]
    const nextStep = steps[afterIndex + 1]
    let newStep: StepData
    if (scenarioType === 'scheduled') {
      newStep = {
        delay_days: 0,
        message_type: 'SMS',
        message_content: '',
        scheduled_at: '',
        target_filter: { type: 'all' as const },
      }
    } else {
      // D+N을 이전/다음 스텝 사이로
      const prevDay = prevStep?.delay_days ?? 0
      const nextDay = nextStep?.delay_days ?? prevDay + 2
      const midDay = Math.floor((prevDay + nextDay) / 2)
      newStep = {
        delay_days: midDay <= prevDay ? prevDay + 1 : midDay,
        message_type: 'SMS',
        message_content: '',
      }
    }
    const newSteps = [...steps]
    newSteps.splice(afterIndex + 1, 0, newStep)
    setSteps(newSteps)
    setSelectedStep(afterIndex + 1)
  }

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index)
    setSteps(newSteps)
    if (selectedStep >= newSteps.length) {
      setSelectedStep(Math.max(0, newSteps.length - 1))
    } else if (selectedStep > index) {
      setSelectedStep(selectedStep - 1)
    }
  }

  const connectedGroup = filterType === 'group' && triggerGroupId
    ? groups.find((g) => g.id === triggerGroupId)
    : null

  const canSave =
    name.trim() &&
    steps.length > 0 &&
    steps.every((s) => s.message_content.trim())

  const handleSave = async () => {
    if (!canSave) return
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const triggerFilter =
      filterType === 'source' && triggerSource
        ? { source: triggerSource }
        : filterType === 'group' && triggerGroupId
          ? { group_id: triggerGroupId }
          : null

    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .insert({
        workspace_id: workspaceId,
        name: name.trim(),
        description: description.trim() || null,
        trigger_type: scenarioType === 'scheduled' ? 'manual' : triggerType,
        trigger_filter: scenarioType === 'scheduled' ? null : triggerFilter,
        scenario_type: scenarioType,
        send_time: scenarioType === 'sequential' ? sendTime : null,
        is_active: true,
      })
      .select('id')
      .single()

    if (scenarioError || !scenario) {
      setError('시나리오 생성에 실패했습니다.')
      setLoading(false)
      return
    }

    const stepInserts = steps.map((step, i) => ({
      scenario_id: scenario.id,
      step_order: i,
      delay_days: step.delay_days,
      message_type: step.message_type,
      message_content: step.message_content,
      template_id: step.template_id || null,
      variable_bindings: (step.variable_bindings ?? {}) as any,
      scheduled_at: step.scheduled_at || null,
      target_filter: (step.target_filter ?? null) as any,
      kakao_options: step.kakao_options?.pf_id ? (step.kakao_options as any) : null,
    }))

    const { error: stepsError } = await supabase
      .from('scenario_steps')
      .insert(stepInserts)

    if (stepsError) {
      setError('스텝 생성에 실패했습니다.')
      setLoading(false)
      return
    }

    router.push(`/scenarios/${scenario.id}`)
  }

  // D+N 라벨 포맷
  const formatDelay = (days: number) => {
    if (days === 0) return '등록 즉시'
    return `D+${days}`
  }

  if (!hasIntegration) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/scenarios" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <h2 className="text-xl font-bold text-gray-900">새 시나리오</h2>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-gray-900">발송 서비스 연동이 필요합니다</p>
            <p className="text-[14px] text-gray-500 mt-1">
              시나리오 발송을 위해 발송 설정에서 API 키를 먼저 연동해 주세요.
            </p>
          </div>
          <Link href={`/workspace/${workspaceId}/settings`}>
            <Button className="h-10 px-5 rounded-lg text-[14px] font-semibold bg-primary hover:bg-primary/90 gap-1.5">
              <Settings className="w-4 h-4" />
              발송 설정으로 이동
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/scenarios" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="시나리오 이름을 입력하세요"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 w-64 rounded-lg border-gray-200 text-[16px] font-bold placeholder:font-normal placeholder:text-gray-400"
                autoFocus
              />
              <span className="text-[12px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">초안</span>
            </div>
            <div className="flex items-center gap-2 mt-1 ml-1">
              {connectedGroup && (
                <>
                  <span className="text-[13px] text-gray-400">연결 그룹:</span>
                  <span className="text-[13px] font-semibold text-primary">{connectedGroup.name}</span>
                  <span className="text-[13px] text-gray-300">·</span>
                </>
              )}
              <span className="text-[13px] text-gray-400">{steps.length} 스텝</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/scenarios">
            <Button
              variant="outline"
              className="h-9 px-4 rounded-lg text-[14px] font-semibold border-gray-200"
            >
              취소
            </Button>
          </Link>
          <Button
            onClick={handleSave}
            disabled={!canSave || loading}
            className="h-9 px-5 rounded-lg text-[14px] font-semibold bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              '저장'
            )}
          </Button>
        </div>
      </div>

      {/* 시나리오 타입 선택 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setScenarioType('sequential')
            setSteps([{ delay_days: 0, message_type: 'SMS', message_content: '' }])
            setSelectedStep(0)
          }}
          className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${
            scenarioType === 'sequential'
              ? 'border-primary bg-primary/5'
              : 'border-gray-100 bg-white hover:border-gray-200'
          }`}
        >
          <p className={`text-[14px] font-semibold ${scenarioType === 'sequential' ? 'text-primary' : 'text-gray-900'}`}>
            순차 발송
          </p>
          <p className="text-[12px] text-gray-400 mt-0.5">
            리드 등록 시점 기준 D+N 자동 발송
          </p>
        </button>
        <button
          type="button"
          onClick={() => {
            setScenarioType('scheduled')
            setSteps([{ delay_days: 0, message_type: 'SMS', message_content: '', scheduled_at: '', target_filter: { type: 'all' } }])
            setSelectedStep(0)
          }}
          className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${
            scenarioType === 'scheduled'
              ? 'border-primary bg-primary/5'
              : 'border-gray-100 bg-white hover:border-gray-200'
          }`}
        >
          <p className={`text-[14px] font-semibold ${scenarioType === 'scheduled' ? 'text-primary' : 'text-gray-900'}`}>
            일괄 발송
          </p>
          <p className="text-[12px] text-gray-400 mt-0.5">
            지정 날짜/시간에 타겟 세그먼트별 발송
          </p>
        </button>
      </div>

      {/* 설정 카드 */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
        {scenarioType === 'sequential' ? (
          <div className="grid grid-cols-[1fr_auto_1fr_auto_auto] gap-5 items-start">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-gray-400">설명</Label>
              <Textarea
                placeholder="시나리오에 대한 간단한 설명 (선택)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[40px] rounded-lg border-gray-200 text-[14px] resize-none"
                rows={1}
              />
            </div>
            <div className="w-px h-full bg-gray-100" />
            <div className="space-y-2">
              <Label className="text-[13px] font-semibold text-gray-400">트리거</Label>
              <div className="flex items-center gap-2">
                <Select value={triggerType} onValueChange={(v) => setTriggerType(v ?? 'auto_on_create')}>
                  <SelectTrigger className="h-9 rounded-lg border-gray-200 text-[14px] flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="auto_on_create" className="text-[14px]">자동 — 리드 생성 시</SelectItem>
                    <SelectItem value="manual" className="text-[14px]">수동</SelectItem>
                  </SelectContent>
                </Select>
                {triggerType === 'auto_on_create' && (
                  <Select
                    value={filterType}
                    onValueChange={(v) => {
                      setFilterType(v as 'none' | 'source' | 'group')
                      setTriggerSource('')
                      setTriggerGroupId('')
                    }}
                  >
                    <SelectTrigger className="h-9 rounded-lg border-gray-200 text-[14px] flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      <SelectItem value="none" className="text-[14px]">전체 리드</SelectItem>
                      {sources.length > 0 && <SelectItem value="source" className="text-[14px]">유입경로별</SelectItem>}
                      {groups.length > 0 && <SelectItem value="group" className="text-[14px]">그룹별</SelectItem>}
                    </SelectContent>
                  </Select>
                )}
              </div>
              {triggerType === 'auto_on_create' && filterType === 'source' && sources.length > 0 && (
                <Select value={triggerSource} onValueChange={(v) => setTriggerSource(v ?? '')}>
                  <SelectTrigger className="h-9 rounded-lg border-gray-200 text-[14px]"><SelectValue placeholder="유입경로 선택" /></SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {sources.map((s) => (<SelectItem key={s} value={s} className="text-[14px]">{s}</SelectItem>))}
                  </SelectContent>
                </Select>
              )}
              {triggerType === 'auto_on_create' && filterType === 'group' && groups.length > 0 && (
                <Select value={triggerGroupId} onValueChange={(v) => setTriggerGroupId(v ?? '')}>
                  <SelectTrigger className="h-9 rounded-lg border-gray-200 text-[14px]"><SelectValue placeholder="그룹 선택" /></SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id} className="text-[14px]">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color ?? '#94a3b8' }} />
                          {g.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="w-px h-full bg-gray-100" />
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-gray-400">발송 시각</Label>
              <Input
                type="time"
                value={sendTime}
                onChange={(e) => setSendTime(e.target.value)}
                className="h-9 w-28 rounded-lg border-gray-200 text-[14px]"
              />
              <p className="text-[11px] text-gray-400">매 D+N일 이 시각에 발송</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label className="text-[13px] font-semibold text-gray-400">설명</Label>
            <Textarea
              placeholder="일괄 발송 시나리오에 대한 설명 (선택)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[40px] rounded-lg border-gray-200 text-[14px] resize-none"
              rows={1}
            />
            <p className="text-[12px] text-gray-400">
              각 스텝마다 발송 일시와 타겟 세그먼트를 개별 설정합니다.
            </p>
          </div>
        )}
      </div>

      {/* 그룹 연결 배너 (순차 발송만) */}
      {scenarioType === 'sequential' && connectedGroup && (
        <div className="flex items-center gap-3 bg-blue-50/60 border border-blue-100 rounded-lg px-4 py-2.5">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[14px] text-gray-600">이 시나리오가 실행될 그룹</span>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-blue-100">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: connectedGroup.color ?? '#94a3b8' }}
            />
            <span className="text-[14px] font-semibold text-gray-900">{connectedGroup.name}</span>
          </div>
        </div>
      )}

      {/* 메인: 타임라인 + 에디터 패널 */}
      <div className="grid grid-cols-[1fr_380px] gap-5 items-start">

        {/* 좌측: 타임라인 / 캘린더 */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
          {/* 일괄 발송일 때 뷰 토글 */}
          {scenarioType === 'scheduled' && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-[13px] font-semibold text-gray-400">
                {stepView === 'calendar' ? '캘린더 보기' : '타임라인 보기'}
              </span>
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setStepView('timeline')}
                  className={`h-7 px-2 rounded-md flex items-center gap-1 text-[12px] font-medium transition-colors ${
                    stepView === 'timeline'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <LayoutList className="w-3 h-3" />
                  타임라인
                </button>
                <button
                  type="button"
                  onClick={() => setStepView('calendar')}
                  className={`h-7 px-2 rounded-md flex items-center gap-1 text-[12px] font-medium transition-colors ${
                    stepView === 'calendar'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <CalendarDays className="w-3 h-3" />
                  캘린더
                </button>
              </div>
            </div>
          )}

          {/* 캘린더 뷰 (일괄 발송 전용) */}
          {scenarioType === 'scheduled' && stepView === 'calendar' ? (
            <ScheduledCalendarView
              steps={steps}
              selectedStep={selectedStep}
              calendarDate={calendarDate}
              setCalendarDate={setCalendarDate}
              onSelectStep={setSelectedStep}
              onAddStep={addStep}
            />
          ) : (
          <>
          <div className="space-y-1.5">
            {steps.map((step, i) => {
              const isSelected = selectedStep === i
              const badge = getTypeBadge(step.message_type)
              const hasContent = step.message_content.trim().length > 0
              const preview = step.message_content.trim().slice(0, 60)

              return (
                <div key={i}>
                  <div className="relative flex">
                    {/* 좌측: 라벨 */}
                    <div className="w-28 shrink-0 pt-2 text-right pr-5">
                      {scenarioType === 'scheduled' ? (
                        <div>
                          <p className={`text-[13px] font-bold ${isSelected ? 'text-primary' : 'text-gray-700'}`}>
                            {step.scheduled_at
                              ? new Date(step.scheduled_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                              : '날짜 미정'}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {step.scheduled_at
                              ? new Date(step.scheduled_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                              : ''}
                          </p>
                        </div>
                      ) : (
                        <p className={`text-[14px] font-bold ${isSelected ? 'text-primary' : 'text-gray-700'}`}>
                          {formatDelay(step.delay_days)}
                        </p>
                      )}
                    </div>

                    {/* 중앙: 타임라인 도트 + 세로선 */}
                    <div className="relative flex flex-col items-center shrink-0">
                      <div className={`w-3 h-3 rounded-full border-2 mt-3 z-10 ${
                        isSelected
                          ? 'border-primary bg-primary/20'
                          : hasContent
                            ? 'border-green-400 bg-green-50'
                            : 'border-gray-300 bg-white'
                      }`} />
                      {i < steps.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-100" />
                      )}
                    </div>

                    {/* 우측: 스텝 카드 */}
                    <div className="flex-1 pl-4">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedStep(i)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedStep(i) }}
                      className={`rounded-lg transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white border-2 border-primary/20 shadow-sm'
                          : 'bg-gray-50 border border-transparent hover:border-gray-200'
                      }`}
                    >
                      {/* 카드 헤더 */}
                      <div className="flex items-center justify-between px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-md ${badge.badgeCls}`}>
                            {badge.label}
                          </span>
                          {hasContent ? (
                            <span className="text-[14px] font-medium text-gray-900 line-clamp-1">
                              {preview.split('\n')[0].slice(0, 30)}{preview.split('\n')[0].length > 30 ? '…' : ''}
                            </span>
                          ) : (
                            <span className="text-[14px] text-gray-400">메시지를 입력하세요</span>
                          )}
                        </div>
                      </div>

                      {/* 선택된 스텝: 메시지 미리보기 + 액션 버튼 */}
                      {isSelected && (
                        <>
                          {hasContent && (
                            <div className="mx-3 mb-2 p-2.5 bg-gray-50 rounded-lg">
                              <p className="text-[13px] text-gray-600 whitespace-pre-wrap line-clamp-4 leading-relaxed">
                                {step.message_content.slice(0, 200)}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 px-3 pb-2">
                            <button
                              type="button"
                              className="h-7 px-2.5 rounded-md text-[12px] font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                            >
                              템플릿
                            </button>
                            <button
                              type="button"
                              className="h-7 px-2.5 rounded-md text-[12px] font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                            >
                              조건
                            </button>
                            {steps.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeStep(i)
                                }}
                                className="h-7 px-2.5 rounded-md text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors"
                              >
                                삭제
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  </div>

                  {/* 블록 사이 삽입 버튼 */}
                  {i < steps.length - 1 && (
                    <div className="group/insert relative h-0">
                      <div className="absolute left-28 right-0 ml-7 flex justify-center z-20">
                        <button
                          type="button"
                          onClick={() => insertStepAt(i)}
                          className="w-5 h-5 -mt-2.5 rounded-full bg-white border-2 border-gray-200 text-gray-300 flex items-center justify-center opacity-0 group-hover/insert:opacity-100 hover:!border-primary hover:!text-primary hover:!bg-primary/5 transition-all cursor-pointer shadow-sm"
                          title="스텝 추가"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* 스텝 추가 */}
          <div className="flex">
            <div className="w-24 shrink-0" />
            <div className="w-3 shrink-0" />
            <div className="flex-1 pl-5">
              <button
                type="button"
                onClick={addStep}
                className="w-full flex items-center justify-center gap-1.5 h-10 rounded-lg border border-dashed border-gray-200 text-[13px] font-semibold text-gray-400 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                스텝 추가
              </button>
            </div>
          </div>
          </>
          )}
        </div>

        {/* 우측: 스텝 편집 패널 */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm sticky top-6">
          {steps[selectedStep] ? (
            <div>
              {/* 패널 헤더 */}
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-gray-900">
                    스텝 {selectedStep + 1}
                  </span>
                  <span className="text-[13px] text-gray-400">
                    {scenarioType === 'scheduled'
                      ? (steps[selectedStep].scheduled_at
                          ? new Date(steps[selectedStep].scheduled_at!).toLocaleDateString('ko-KR')
                          : '날짜 미정')
                      : formatDelay(steps[selectedStep].delay_days)}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* 발송 시점 */}
                {scenarioType === 'scheduled' ? (
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold text-gray-400">발송 일시</Label>
                    <Input
                      type="datetime-local"
                      value={steps[selectedStep].scheduled_at ?? ''}
                      onChange={(e) =>
                        updateStep(selectedStep, {
                          ...steps[selectedStep],
                          scheduled_at: e.target.value,
                        })
                      }
                      className="h-9 rounded-lg border-gray-200 text-[14px]"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold text-gray-400">발송 시점</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] text-gray-500">D +</span>
                      <Input
                        type="number"
                        min={0}
                        value={steps[selectedStep].delay_days}
                        onChange={(e) =>
                          updateStep(selectedStep, {
                            ...steps[selectedStep],
                            delay_days: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-20 h-9 rounded-lg border-gray-200 text-[14px] text-center"
                      />
                      <span className="text-[13px] text-gray-400">일 후</span>
                    </div>
                  </div>
                )}

                {/* 타겟 세그먼트 (일괄 발송만) */}
                {scenarioType === 'scheduled' && (
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold text-gray-400">발송 대상</Label>
                    <Select
                      value={steps[selectedStep].target_filter?.type ?? 'all'}
                      onValueChange={(v) => {
                        if (!v) return
                        const tf: StepTargetFilter = v === 'all'
                          ? { type: 'all' }
                          : v === 'group'
                            ? { type: 'group', group_id: '' }
                            : { type: 'source', source: '' }
                        updateStep(selectedStep, {
                          ...steps[selectedStep],
                          target_filter: tf,
                        })
                      }}
                    >
                      <SelectTrigger className="h-9 rounded-lg border-gray-200 text-[14px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        <SelectItem value="all" className="text-[14px]">전체 리드</SelectItem>
                        {groups.length > 0 && <SelectItem value="group" className="text-[14px]">그룹별</SelectItem>}
                        {sources.length > 0 && <SelectItem value="source" className="text-[14px]">유입경로별</SelectItem>}
                      </SelectContent>
                    </Select>

                    {steps[selectedStep].target_filter?.type === 'group' && groups.length > 0 && (
                      <Select
                        value={steps[selectedStep].target_filter?.group_id ?? ''}
                        onValueChange={(v) => {
                          if (!v) return
                          updateStep(selectedStep, {
                            ...steps[selectedStep],
                            target_filter: { type: 'group', group_id: v },
                          })
                        }}
                      >
                        <SelectTrigger className="h-9 rounded-lg border-gray-200 text-[14px]">
                          <SelectValue placeholder="그룹 선택" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          {groups.map((g) => (
                            <SelectItem key={g.id} value={g.id} className="text-[14px]">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color ?? '#94a3b8' }} />
                                {g.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {steps[selectedStep].target_filter?.type === 'source' && sources.length > 0 && (
                      <Select
                        value={steps[selectedStep].target_filter?.source ?? ''}
                        onValueChange={(v) => {
                          if (!v) return
                          updateStep(selectedStep, {
                            ...steps[selectedStep],
                            target_filter: { type: 'source', source: v },
                          })
                        }}
                      >
                        <SelectTrigger className="h-9 rounded-lg border-gray-200 text-[14px]">
                          <SelectValue placeholder="유입경로 선택" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          {sources.map((s) => (
                            <SelectItem key={s} value={s} className="text-[14px]">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                {/* 메시지 타입 */}
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold text-gray-400">메시지 타입</Label>
                  <div className="flex gap-1.5">
                    {MESSAGE_TYPES.map((t) => {
                      const isActive = steps[selectedStep].message_type === t.value
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() =>
                            updateStep(selectedStep, {
                              ...steps[selectedStep],
                              message_type: t.value,
                            })
                          }
                          className={`h-8 px-3 rounded-lg text-[13px] font-semibold border transition-colors ${
                            isActive
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {t.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* === 알림톡: 채널 선택 + 템플릿 선택 + 읽기전용 내용 === */}
                {steps[selectedStep].message_type === 'ALIMTALK' ? (
                  <>
                    {/* 카카오 채널 선택 */}
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-semibold text-gray-400">카카오 채널</Label>
                      {kakaoChannels.length === 0 ? (
                        <div className="h-9 rounded-lg border border-orange-200 bg-orange-50 flex items-center px-3">
                          <span className="text-[13px] text-orange-500">
                            {templatesLoading ? '채널 불러오는 중...' : '연결된 카카오 채널이 없습니다'}
                          </span>
                        </div>
                      ) : kakaoChannels.length === 1 ? (
                        <div className="h-9 rounded-lg border border-gray-200 bg-gray-50 flex items-center px-3">
                          <span className="text-[14px] text-gray-700">
                            {kakaoChannels[0].channelName} ({kakaoChannels[0].searchId || kakaoChannels[0].pfId})
                          </span>
                        </div>
                      ) : (
                        <Select
                          value={steps[selectedStep].kakao_options?.pf_id ?? ''}
                          onValueChange={(pfId) => {
                            if (!pfId) return
                            updateStep(selectedStep, {
                              ...steps[selectedStep],
                              kakao_options: { pf_id: pfId },
                            })
                          }}
                        >
                          <SelectTrigger className="h-9 rounded-lg border-gray-200 text-[14px]">
                            <SelectValue placeholder="카카오 채널을 선택하세요" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            {kakaoChannels.map((ch, idx) => (
                              <SelectItem key={`${ch.pfId}-${idx}`} value={ch.pfId} className="text-[14px]">
                                {ch.channelName} ({ch.searchId || ch.pfId})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* 템플릿 선택 */}
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-semibold text-gray-400">알림톡 템플릿</Label>
                      {templatesLoading ? (
                        <div className="h-9 rounded-lg border border-gray-200 flex items-center px-3">
                          <span className="text-[13px] text-gray-400">템플릿 목록 불러오는 중...</span>
                        </div>
                      ) : alimtalkTemplates.length > 0 ? (
                        <Select
                          value={steps[selectedStep].template_id ?? ''}
                          onValueChange={(templateId) => {
                            if (!templateId) return
                            const tmpl = alimtalkTemplates.find((t) => t.templateId === templateId)
                            updateStep(selectedStep, {
                              ...steps[selectedStep],
                              template_id: templateId,
                              message_content: tmpl?.content ?? '',
                              variable_bindings: {},
                            })
                          }}
                        >
                          <SelectTrigger className="h-9 rounded-lg border-gray-200 text-[14px]">
                            <SelectValue placeholder="템플릿을 선택하세요" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg max-h-[280px]">
                            {alimtalkTemplates.map((tmpl) => (
                              <SelectItem key={tmpl.templateId} value={tmpl.templateId} className="text-[14px]">
                                <div className="flex items-center gap-2">
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    tmpl.status === 'APPROVED' ? 'bg-green-400' : 'bg-gray-300'
                                  }`} />
                                  <span className="truncate">{tmpl.name || tmpl.templateId}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div>
                          <Input
                            placeholder="예: KA01TP2406180001"
                            value={steps[selectedStep].template_id ?? ''}
                            onChange={(e) =>
                              updateStep(selectedStep, {
                                ...steps[selectedStep],
                                template_id: e.target.value,
                              })
                            }
                            className="h-9 rounded-lg border-gray-200 text-[14px] font-mono"
                          />
                          <p className="text-[12px] text-gray-400 mt-1">
                            등록된 템플릿이 없습니다. 코드를 직접 입력하세요.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 템플릿 ID */}
                    {steps[selectedStep].template_id && (
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-gray-400">템플릿 ID:</span>
                        <code className="text-[12px] font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded">
                          {steps[selectedStep].template_id}
                        </code>
                      </div>
                    )}

                    {/* 읽기전용 템플릿 내용 */}
                    {steps[selectedStep].message_content && (
                      <div className="space-y-1.5">
                        <Label className="text-[13px] font-semibold text-gray-400">템플릿 내용</Label>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 min-h-[100px]">
                          <p className="text-[14px] text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {steps[selectedStep].message_content}
                          </p>
                        </div>
                        <p className="text-[12px] text-gray-400">
                          알림톡 템플릿은 카카오에서 승인된 내용만 발송됩니다.
                        </p>
                      </div>
                    )}

                    {/* 문구 치환 */}
                    <VariableBindingBox
                      variables={extractVariables(steps[selectedStep].message_content)}
                      bindings={steps[selectedStep].variable_bindings ?? {}}
                      onChange={(bindings) =>
                        updateStep(selectedStep, {
                          ...steps[selectedStep],
                          variable_bindings: bindings,
                        })
                      }
                    />

                    {/* 발송실패 시 SMS 대체발송 */}
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
                      <div className="w-4 h-4 rounded border border-gray-300 bg-white flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                      </div>
                      <span className="text-[13px] text-gray-600">발송실패 시 SMS 대체발송</span>
                    </div>
                  </>
                ) : steps[selectedStep].message_type === 'FRIENDTALK' ? (
                  /* === 친구톡: 채널 선택 + 자유 텍스트 === */
                  <>
                    {/* 카카오 채널 선택 */}
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-semibold text-gray-400">카카오 채널</Label>
                      {kakaoChannels.length === 0 ? (
                        <div className="h-9 rounded-lg border border-yellow-200 bg-yellow-50 flex items-center px-3">
                          <span className="text-[13px] text-yellow-700">
                            {templatesLoading ? '채널 불러오는 중...' : '연결된 카카오 채널이 없습니다'}
                          </span>
                        </div>
                      ) : kakaoChannels.length === 1 ? (
                        <div className="h-9 rounded-lg border border-gray-200 bg-gray-50 flex items-center px-3">
                          <span className="text-[14px] text-gray-700">
                            {kakaoChannels[0].channelName} ({kakaoChannels[0].searchId || kakaoChannels[0].pfId})
                          </span>
                        </div>
                      ) : (
                        <Select
                          value={steps[selectedStep].kakao_options?.pf_id ?? ''}
                          onValueChange={(pfId) => {
                            if (!pfId) return
                            updateStep(selectedStep, {
                              ...steps[selectedStep],
                              kakao_options: { pf_id: pfId },
                            })
                          }}
                        >
                          <SelectTrigger className="h-9 rounded-lg border-gray-200 text-[14px]">
                            <SelectValue placeholder="카카오 채널을 선택하세요" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            {kakaoChannels.map((ch, idx) => (
                              <SelectItem key={`${ch.pfId}-${idx}`} value={ch.pfId} className="text-[14px]">
                                {ch.channelName} ({ch.searchId || ch.pfId})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div className="bg-yellow-50/50 border border-yellow-100 rounded-lg px-3 py-2 space-y-1">
                      <p className="text-[12px] text-yellow-700">브랜드 메시지 자유유형으로 발송됩니다. 채널 친구에게만 발송 가능합니다.</p>
                      <p className="text-[11px] text-yellow-600">발송 가능 시간: 매일 08:00 ~ 20:50</p>
                    </div>

                    {/* 메시지 내용 */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-[13px] font-semibold text-gray-400">메시지 내용</Label>
                        <span className="text-[12px] text-gray-400">{steps[selectedStep].message_content.length} / 1,300 자</span>
                      </div>
                      <Textarea
                        placeholder={'메시지 내용을 입력하세요.\n#{변수명} 형식으로 변수를 사용할 수 있습니다.'}
                        value={steps[selectedStep].message_content}
                        onChange={(e) => {
                          if (e.target.value.length > 1300) return
                          updateStep(selectedStep, {
                            ...steps[selectedStep],
                            message_content: e.target.value,
                          })
                        }}
                        className="min-h-[140px] rounded-lg border-gray-200 text-[14px] resize-none"
                        rows={6}
                      />
                    </div>

                    {/* 문구 치환 */}
                    <VariableBindingBox
                      variables={extractVariables(steps[selectedStep].message_content)}
                      bindings={steps[selectedStep].variable_bindings ?? {}}
                      onChange={(bindings) =>
                        updateStep(selectedStep, {
                          ...steps[selectedStep],
                          variable_bindings: bindings,
                        })
                      }
                    />
                  </>
                ) : (
                  /* === SMS / 이메일: 직접 편집 + 커스텀 변수 생성 === */
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-semibold text-gray-400">메시지 내용</Label>

                      {/* 변수 삽입 버튼 */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[12px] text-gray-400 mr-0.5">변수:</span>
                        {extractVariables(steps[selectedStep].message_content).map((v) => (
                          <span
                            key={v}
                            className="h-6 px-2 rounded-md text-[12px] font-medium bg-amber-50 text-amber-600 flex items-center"
                          >
                            {'#{' + v + '}'}
                          </span>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const existing = extractVariables(steps[selectedStep].message_content)
                            const nextNum = existing.length + 1
                            let varName = `변수${nextNum}`
                            // 중복 방지
                            while (existing.includes(varName)) {
                              varName = `변수${parseInt(varName.replace('변수', '')) + 1}`
                            }
                            const token = `#{${varName}}`
                            updateStep(selectedStep, {
                              ...steps[selectedStep],
                              message_content: steps[selectedStep].message_content + token,
                            })
                          }}
                          className="h-6 px-2 rounded-md text-[12px] font-medium border border-dashed border-gray-300 text-gray-400 hover:border-primary hover:text-primary transition-colors flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" />
                          변수 추가
                        </button>
                      </div>

                      {/* 텍스트 에디터 */}
                      <Textarea
                        placeholder={'메시지 내용을 입력하세요.\n#{변수명} 형식으로 변수를 사용할 수 있습니다.'}
                        value={steps[selectedStep].message_content}
                        onChange={(e) =>
                          updateStep(selectedStep, {
                            ...steps[selectedStep],
                            message_content: e.target.value,
                          })
                        }
                        className="min-h-[140px] rounded-lg border-gray-200 text-[14px] resize-none"
                        rows={6}
                      />

                      {/* 바이트 카운터 */}
                      {steps[selectedStep].message_type === 'SMS' && (() => {
                        const msgType = detectMessageType(steps[selectedStep].message_content)
                        return (
                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                              msgType === 'SMS' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                            }`}>
                              {msgType}
                            </span>
                            {msgType === 'LMS' && (
                              <span className="text-[11px] text-orange-400">90바이트 초과 → LMS</span>
                            )}
                          </div>
                        )
                      })()}
                    </div>

                    {/* 문구 치환 */}
                    <VariableBindingBox
                      variables={extractVariables(steps[selectedStep].message_content)}
                      bindings={steps[selectedStep].variable_bindings ?? {}}
                      onChange={(bindings) =>
                        updateStep(selectedStep, {
                          ...steps[selectedStep],
                          variable_bindings: bindings,
                        })
                      }
                    />
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-[14px] text-gray-400">
              좌측에서 스텝을 선택하세요.
            </div>
          )}
        </div>
      </div>

      {/* 에러 */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
          <p className="text-[14px] text-red-600">{error}</p>
        </div>
      )}
    </div>
  )
}
