'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  AlertCircle,
  Search,
  Users,
  X,
  Plus,
  Trash2,
  MessageSquare,
  Mail,
  Clock,
  Megaphone,
  UserPlus,
  Coins,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import SendConfirmDialog from '@/components/campaigns/SendConfirmDialog'
import VariableBindingBox from '@/components/scenarios/VariableBindingBox'
import type { VariableBinding } from '@/components/scenarios/StepEditor'
import {
  AVAILABLE_VARIABLES,
  getByteLength,
  detectMessageType,
  extractVariables,
} from '@/lib/campaigns/variables'
import type { Lead, LeadGroup } from '@/types'

interface AlimtalkTemplate {
  templateId: string
  name: string
  content: string
  status: string
  pfId: string | null
  channelId: string | null
}

interface KakaoChannel {
  pfId: string
  searchId: string
  channelName: string
}

interface CampaignCreateClientProps {
  workspaceId: string
  leads: Lead[]
  groups: LeadGroup[]
  hasIntegration: boolean
}

type RecipientMode = 'direct' | 'group' | 'source' | 'all'
type ChannelType = 'SMS' | 'ALIMTALK' | 'FRIENDTALK' | 'EMAIL'

const CHANNEL_OPTIONS: { type: ChannelType; label: string; color: string; bg: string }[] = [
  { type: 'SMS', label: '문자메시지', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  { type: 'ALIMTALK', label: '알림톡', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  { type: 'FRIENDTALK', label: '친구톡(브랜드)', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  { type: 'EMAIL', label: '이메일', color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
]

export default function CampaignCreateClient({
  workspaceId,
  leads,
  groups,
  hasIntegration,
}: CampaignCreateClientProps) {
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 채널/메시지 타입
  const [channelType, setChannelType] = useState<ChannelType>('SMS')

  // 수신자 상태
  const [recipientMode, setRecipientMode] = useState<RecipientMode>('all')
  const [phoneInput, setPhoneInput] = useState('')
  const [directPhones, setDirectPhones] = useState<string[]>([])
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [selectedSource, setSelectedSource] = useState('')
  const [leadSearch, setLeadSearch] = useState('')

  // 누적된 수신 대상
  type RecipientSegment =
    | { type: 'all' }
    | { type: 'group'; groupIds: string[]; names: string[] }
    | { type: 'source'; source: string }
    | { type: 'direct'; phones: string[] }
  const [segments, setSegments] = useState<RecipientSegment[]>([])

  const addSegment = () => {
    if (recipientMode === 'all') {
      // 전체 추가 시 기존 세그먼트 대체
      setSegments([{ type: 'all' }])
    } else if (recipientMode === 'group' && selectedGroupIds.length > 0) {
      const names = selectedGroupIds.map((id) => groups.find((g) => g.id === id)?.name ?? '').filter(Boolean)
      // 기존 그룹 세그먼트에 머지
      setSegments((prev) => {
        const existing = prev.find((s): s is Extract<RecipientSegment, { type: 'group' }> => s.type === 'group')
        const others = prev.filter((s) => s.type !== 'group' && s.type !== 'all')
        const mergedIds = [...new Set([...(existing?.groupIds ?? []), ...selectedGroupIds])]
        const mergedNames = [...new Set([...(existing?.names ?? []), ...names])]
        return [...others, { type: 'group', groupIds: mergedIds, names: mergedNames }]
      })
      setSelectedGroupIds([])
    } else if (recipientMode === 'source' && selectedSource) {
      setSegments((prev) => {
        const others = prev.filter((s) => s.type !== 'all')
        if (others.some((s) => s.type === 'source' && s.source === selectedSource)) return others
        return [...others, { type: 'source', source: selectedSource }]
      })
      setSelectedSource('')
    } else if (recipientMode === 'direct' && directPhones.length > 0) {
      setSegments((prev) => {
        const existing = prev.find((s): s is Extract<RecipientSegment, { type: 'direct' }> => s.type === 'direct')
        const others = prev.filter((s) => s.type !== 'direct' && s.type !== 'all')
        const merged = [...new Set([...(existing?.phones ?? []), ...directPhones])]
        return [...others, { type: 'direct', phones: merged }]
      })
      setDirectPhones([])
    }
  }

  const removeSegment = (index: number) => {
    setSegments((prev) => prev.filter((_, i) => i !== index))
  }

  // 메시지 상태
  const [title, setTitle] = useState('')
  const [template, setTemplate] = useState('')
  const [variableBindings, setVariableBindings] = useState<Record<string, VariableBinding>>({})

  // 알림톡 상태
  const [alimtalkTemplates, setAlimtalkTemplates] = useState<AlimtalkTemplate[]>([])
  const [kakaoChannels, setKakaoChannels] = useState<KakaoChannel[]>([])
  const [selectedPfId, setSelectedPfId] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [templatesLoading, setTemplatesLoading] = useState(false)

  // 이메일 상태
  const [emailSubject, setEmailSubject] = useState('')

  // SMS 커스텀 변수
  const [customVarCounter, setCustomVarCounter] = useState(0)

  // 수신자 추가
  const [showAddRecipient, setShowAddRecipient] = useState(false)
  const [newRecipientName, setNewRecipientName] = useState('')
  const [newRecipientPhone, setNewRecipientPhone] = useState('')
  const [addingRecipient, setAddingRecipient] = useState(false)

  // 크레딧 잔액
  const [creditBalance, setCreditBalance] = useState<number | null>(null)
  useEffect(() => {
    fetch(`/api/credits/balance?workspace_id=${workspaceId}`)
      .then((r) => r.json())
      .then((d) => setCreditBalance(d.balance ?? 0))
      .catch(() => {})
  }, [workspaceId])

  // 예약 발송
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')

  // 친구톡(브랜드 메시지) — SMS 대체발송
  const [friendTalkSmsFallback, setFriendTalkSmsFallback] = useState(false)

  // 광고 메시지
  const [isAd, setIsAd] = useState(false)

  // 발송
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const smsMessageType = detectMessageType(template)
  const bytes = getByteLength(template)
  const variables = extractVariables(template)

  // 카카오 채널 + 알림톡 템플릿 로드 (페이지 진입 시 1회)
  useEffect(() => {
    if (!hasIntegration) return
    setTemplatesLoading(true)
    fetch(`/api/integrations/solapi/templates?workspace_id=${workspaceId}`)
      .then((res) => res.json())
      .then((data) => {
        setAlimtalkTemplates(data.templates ?? [])
        setKakaoChannels(data.channels ?? [])
        if (data.channels?.length === 1) {
          setSelectedPfId(data.channels[0].pfId)
        }
      })
      .catch((err) => console.error('[Solapi] fetch failed:', err))
      .finally(() => setTemplatesLoading(false))
  }, [workspaceId, hasIntegration])

  // 알림톡 템플릿 선택 시 내용 + pfId 세팅
  useEffect(() => {
    if (channelType === 'ALIMTALK' && selectedTemplateId) {
      const t = alimtalkTemplates.find((t) => t.templateId === selectedTemplateId)
      if (t) {
        setTemplate(t.content)
        setVariableBindings({})
        // 템플릿에 pfId가 있으면 자동 선택
        if (t.pfId && !selectedPfId) {
          setSelectedPfId(t.pfId)
        }
      }
    }
  }, [selectedTemplateId, channelType, alimtalkTemplates])

  // 유입 경로 목록
  const sources = useMemo(() => {
    const set = new Set(leads.map((l) => l.source).filter(Boolean) as string[])
    return [...set].sort()
  }, [leads])

  const hasRecipients = segments.length > 0

  const recipientCount = useMemo(() => {
    if (segments.some((s) => s.type === 'all')) return leads.length
    // 나머지는 추정치
    let count = 0
    for (const seg of segments) {
      if (seg.type === 'direct') count += seg.phones.length
      if (seg.type === 'source') count += leads.filter((l) => l.source === seg.source).length
      if (seg.type === 'group') count += leads.length // 그룹은 서버사이드이므로 추정
    }
    return count
  }, [segments, leads])

  // 검색된 리드
  const filteredLeads = useMemo(() => {
    if (!leadSearch.trim()) return leads
    const q = leadSearch.trim().toLowerCase()
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        (l.email && l.email.toLowerCase().includes(q))
    )
  }, [leads, leadSearch])

  // 직접 번호 추가
  const addDirectPhone = () => {
    const phone = phoneInput.replace(/[^0-9]/g, '')
    if (phone.length >= 10 && !directPhones.includes(phone)) {
      setDirectPhones([...directPhones, phone])
      setPhoneInput('')
    }
  }

  // 수신자 추가 핸들러 — CRM에 리드 등록 + 직접입력 모드로 번호 추가
  const handleAddRecipient = async () => {
    const name = newRecipientName.trim()
    const phone = newRecipientPhone.replace(/[^0-9]/g, '')
    if (!name || phone.length < 10) return

    setAddingRecipient(true)
    const supabase = createClient()
    const { data: lead } = await supabase
      .from('leads')
      .insert({ workspace_id: workspaceId, name, phone, source: '직접입력' })
      .select('id, phone')
      .single()

    if (lead) {
      if (!directPhones.includes(phone)) {
        setDirectPhones((prev) => [...prev, phone])
      }
    }

    setNewRecipientName('')
    setNewRecipientPhone('')
    setAddingRecipient(false)
  }

  // 변수 삽입 (SMS/이메일)
  const insertVariable = (varKey: string) => {
    const el = textareaRef.current
    if (!el) return
    const token = `#{${varKey}}`
    const start = el.selectionStart
    const end = el.selectionEnd
    const newValue = template.slice(0, start) + token + template.slice(end)
    setTemplate(newValue)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + token.length, start + token.length)
    })
  }

  // 커스텀 변수 추가 (SMS/이메일)
  const addCustomVariable = () => {
    const next = customVarCounter + 1
    setCustomVarCounter(next)
    const varName = `변수${next}`
    insertVariable(varName)
  }

  // targetFilter 생성 (누적된 세그먼트 기반)
  const buildTargetFilter = () => {
    if (segments.some((s) => s.type === 'all')) return { mode: 'all' as const }

    const filter: any = { mode: 'combined' }
    const groupIds: string[] = []
    const filterSources: string[] = []
    const leadIds: string[] = []

    for (const seg of segments) {
      if (seg.type === 'group') groupIds.push(...seg.groupIds)
      if (seg.type === 'source') filterSources.push(seg.source)
      if (seg.type === 'direct') {
        const matched = leads
          .filter((l) => seg.phones.includes(l.phone.replace(/[^0-9]/g, '')))
          .map((l) => l.id)
        leadIds.push(...matched)
      }
    }

    if (groupIds.length > 0) filter.group_ids = groupIds
    if (filterSources.length > 0) filter.sources = filterSources
    if (leadIds.length > 0) filter.lead_ids = leadIds

    return filter
  }

  const handleSend = async () => {
    if (!template.trim() || recipientCount === 0) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const rawName = title.trim() || emailSubject.trim() || `발송 ${new Date().toLocaleDateString('ko-KR')}`
    const campaignName = isAd && !rawName.startsWith('(광고)') ? `(광고) ${rawName}` : rawName

    // 광고 메시지일 때 본문 앞에 (광고) 접두어 + 무료수신거부 안내 추가
    let finalContent = template
    if (isAd && channelType !== 'ALIMTALK') {
      if (!finalContent.startsWith('(광고)')) {
        finalContent = `(광고) ${finalContent}`
      }
      if (!finalContent.includes('무료수신거부')) {
        finalContent += '\n무료수신거부 080-'
      }
    }

    const msgType = channelType === 'ALIMTALK' ? 'ATA' : channelType === 'FRIENDTALK' ? 'FT' : channelType === 'EMAIL' ? 'EMAIL' : smsMessageType

    const { data: campaign, error: insertError } = await supabase
      .from('campaigns')
      .insert({
        workspace_id: workspaceId,
        name: campaignName,
        message_type: msgType,
        message_content: finalContent,
        status: isScheduled ? 'scheduled' : 'draft',
        target_filter: buildTargetFilter() as any,
        total_count: recipientCount,
        scheduled_at: isScheduled && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        ...(channelType === 'ALIMTALK' && selectedTemplateId
          ? { kakao_options: { pf_id: selectedPfId, template_id: selectedTemplateId } as any }
          : channelType === 'FRIENDTALK' && selectedPfId
            ? { kakao_options: {
                pf_id: selectedPfId,
                ad_flag: isAd,
                sms_fallback: friendTalkSmsFallback,
              } as any }
            : {}),
      })
      .select('id')
      .single()

    if (insertError || !campaign) {
      setError('발송 준비에 실패했습니다.')
      setLoading(false)
      return
    }

    if (isScheduled) {
      // 예약 발송 — 즉시 발송하지 않고 상세로 이동
      router.push(`/campaigns/${campaign.id}`)
      router.refresh()
      return
    }

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/send`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? '발송에 실패했습니다.')
        setLoading(false)
        setConfirmOpen(false)
        return
      }
      router.push(`/campaigns/${campaign.id}`)
      router.refresh()
    } catch {
      setError('네트워크 오류가 발생했습니다.')
      setLoading(false)
      setConfirmOpen(false)
    }
  }

  if (!hasIntegration) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/campaigns" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <h2 className="text-[18px] font-bold text-gray-900">메시지 발송</h2>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-orange-400 mx-auto" />
          <p className="text-[16px] font-semibold text-gray-900">발송 서비스 연동이 필요합니다</p>
          <p className="text-[14px] text-gray-500">
            메시지를 발송하려면 먼저 발송 설정에서 API 키를 연동해 주세요.
          </p>
          <Link href={`/workspace/${workspaceId}/settings`}>
            <Button className="mt-2 h-10 px-6 rounded-lg text-[14px] font-semibold bg-primary hover:bg-primary/90">
              발송 설정으로 이동
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1100px] mx-auto space-y-5">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link href="/campaigns" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h2 className="text-[18px] font-bold text-gray-900">메시지 발송</h2>
        <div className="flex-1" />
        {creditBalance !== null && (
          <Link
            href={`/workspace/${workspaceId}/settings`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
          >
            <Coins className="w-3.5 h-3.5 text-primary" />
            <span className="text-[13px] font-bold text-primary">{creditBalance.toLocaleString()}원</span>
          </Link>
        )}
      </div>

      {/* 채널 선택 탭 */}
      <div className="flex gap-2">
        {CHANNEL_OPTIONS.map((ch) => (
          <button
            key={ch.type}
            onClick={() => {
              setChannelType(ch.type)
              setTemplate('')
              setSelectedTemplateId('')
              setSelectedPfId('')
              setVariableBindings({})
              setCustomVarCounter(0)
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[14px] font-semibold border transition-colors ${
              channelType === ch.type
                ? ch.bg + ' ' + ch.color
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {ch.type === 'SMS' && <MessageSquare className="w-4 h-4" />}
            {ch.type === 'ALIMTALK' && <span className="text-[15px]">💬</span>}
            {ch.type === 'FRIENDTALK' && <span className="text-[15px]">💛</span>}
            {ch.type === 'EMAIL' && <Mail className="w-4 h-4" />}
            {ch.label}
          </button>
        ))}
      </div>

      {/* 2컬럼 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
        {/* ========= 좌측: 수신자 설정 ========= */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              수신자 설정
            </h3>

            {/* 모드 탭 */}
            <div className="flex gap-1.5">
              {[
                { mode: 'all' as const, label: '전체' },
                { mode: 'group' as const, label: '그룹' },
                { mode: 'source' as const, label: '유입경로' },
                { mode: 'direct' as const, label: '직접입력' },
              ].map((opt) => (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => setRecipientMode(opt.mode)}
                  className={`flex-1 px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                    recipientMode === opt.mode
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* 전체 */}
            {recipientMode === 'all' && (
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-[14px] font-medium text-blue-700">
                  전체 리드 <span className="text-[16px] font-bold">{leads.length}</span>명
                </p>
              </div>
            )}

            {/* 그룹 */}
            {recipientMode === 'group' && (
              <div className="space-y-2">
                {groups.length === 0 ? (
                  <p className="text-[13px] text-gray-400 py-3 text-center">
                    생성된 그룹이 없습니다.{' '}
                    <Link href="/groups" className="text-primary underline">그룹 만들기</Link>
                  </p>
                ) : (
                  <div className="space-y-1 max-h-[200px] overflow-y-auto rounded-lg border border-gray-200 p-2">
                    {groups.map((g) => {
                      const isChecked = selectedGroupIds.includes(g.id)
                      return (
                        <button key={g.id} type="button" onClick={() => setSelectedGroupIds((prev) => isChecked ? prev.filter((id) => id !== g.id) : [...prev, g.id])} className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${isChecked ? 'bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-gray-50'}`}>
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'border-primary bg-primary' : 'border-gray-300 bg-white'}`}>
                            {isChecked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          {g.color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: g.color }} />}
                          <span className="text-[13px] text-gray-700">{g.name}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 유입경로 */}
            {recipientMode === 'source' && (
              <div className="space-y-2">
                {sources.length === 0 ? (
                  <p className="text-[13px] text-gray-400 py-3 text-center">유입 경로 데이터가 없습니다.</p>
                ) : (
                  <Select value={selectedSource} onValueChange={(v) => { if (v) setSelectedSource(v) }}>
                    <SelectTrigger className="h-9 rounded-lg border-gray-200 text-[14px]">
                      <SelectValue placeholder="유입 경로 선택" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      {sources.map((src) => (
                        <SelectItem key={src} value={src} className="text-[14px]">
                          {src} ({leads.filter((l) => l.source === src).length}명)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* 직접 입력 */}
            {recipientMode === 'direct' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="01012345678" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDirectPhone() } }} className="flex-1 h-9 rounded-lg border-gray-200 text-[14px]" />
                  <Button type="button" size="sm" onClick={addDirectPhone} className="h-9 px-3 rounded-lg text-[13px] font-semibold bg-primary hover:bg-primary/90"><Plus className="w-3.5 h-3.5" /></Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-[12px] font-semibold text-gray-400">CRM 리드에서 선택</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                    <Input placeholder="이름 또는 번호 검색" value={leadSearch} onChange={(e) => setLeadSearch(e.target.value)} className="pl-8 h-8 rounded-lg border-gray-200 text-[13px]" />
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-100">
                    {filteredLeads.slice(0, 50).map((lead) => {
                      const phone = lead.phone.replace(/[^0-9]/g, '')
                      const isSelected = directPhones.includes(phone)
                      return (
                        <div key={lead.id} className="flex items-center gap-2.5 px-2.5 py-2 hover:bg-gray-50 cursor-pointer" onClick={() => setDirectPhones(isSelected ? directPhones.filter((p) => p !== phone) : [...directPhones, phone])}>
                          <Checkbox checked={isSelected} />
                          <div className="flex-1 min-w-0">
                            <span className="text-[13px] font-medium text-gray-800">{lead.name}</span>
                            <span className="text-[12px] text-gray-400 ml-2">{lead.phone}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 추가 버튼 */}
            <Button
              type="button"
              onClick={addSegment}
              disabled={
                (recipientMode === 'group' && selectedGroupIds.length === 0) ||
                (recipientMode === 'source' && !selectedSource) ||
                (recipientMode === 'direct' && directPhones.length === 0)
              }
              className="w-full h-9 rounded-lg text-[13px] font-semibold bg-primary hover:bg-primary/90"
            >
              수신 대상에 추가
            </Button>
          </div>

          {/* 수신 대상 요약 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[14px] font-semibold text-gray-700">
                <Users className="w-3.5 h-3.5 inline mr-1.5 text-gray-400" />
                수신 대상
                {segments.length > 0 && (
                  <span className="ml-1.5 text-primary font-bold">{recipientCount}명</span>
                )}
              </h4>
              {segments.length > 0 && (
                <button type="button" onClick={() => setSegments([])} className="text-[12px] text-gray-400 hover:text-red-500 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" />
                  전체 삭제
                </button>
              )}
            </div>

            {segments.length === 0 ? (
              <p className="text-[13px] text-gray-400 text-center py-3">위에서 수신 대상을 선택 후 추가해 주세요.</p>
            ) : (
              <div className="space-y-1.5">
                {segments.map((seg, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {seg.type === 'all' && (
                        <span className="text-[13px] font-medium text-blue-700">전체 리드 {leads.length}명</span>
                      )}
                      {seg.type === 'group' && (
                        <>
                          <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 shrink-0">그룹</span>
                          <span className="text-[13px] text-gray-700 truncate">{seg.names.join(', ')}</span>
                        </>
                      )}
                      {seg.type === 'source' && (
                        <>
                          <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-green-50 text-green-600 shrink-0">유입경로</span>
                          <span className="text-[13px] text-gray-700">{seg.source}</span>
                        </>
                      )}
                      {seg.type === 'direct' && (
                        <>
                          <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 shrink-0">직접선택</span>
                          <span className="text-[13px] text-gray-700">{seg.phones.length}명</span>
                        </>
                      )}
                    </div>
                    <button type="button" onClick={() => removeSegment(i)} className="text-gray-300 hover:text-red-400 shrink-0 ml-2">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ========= 우측: 메시지 편집 ========= */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">

            {/* ---- SMS 모드 ---- */}
            {channelType === 'SMS' && (
              <>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[13px] font-semibold text-gray-500">제목 (선택 사항)</Label>
                    <span className="text-[12px] text-gray-300">{title.length} / 40</span>
                  </div>
                  <Input
                    placeholder="제목을 입력하세요 (LMS에만 표시)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, 40))}
                    className="h-9 rounded-lg border-gray-200 text-[14px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold text-gray-500">메시지 내용</Label>
                  <Textarea
                    ref={textareaRef}
                    placeholder={`이곳에 문자 내용을 입력합니다\n치환문구 예시) #{이름}님 #{시간}시 방문 예약입니다.`}
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    className="min-h-[200px] rounded-lg border-gray-200 text-[14px] focus-visible:ring-primary resize-y leading-relaxed"
                    rows={8}
                  />
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={addCustomVariable}
                        className="h-7 px-2.5 rounded-md text-[12px] font-medium border border-dashed border-gray-300 hover:border-primary hover:text-primary transition-colors bg-white flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        변수 추가
                      </button>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-md ${smsMessageType === 'SMS' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                        {smsMessageType}
                      </span>
                      <span className="text-[12px] text-gray-400">
                        {bytes} / {smsMessageType === 'SMS' ? '90' : '2,000'} Bytes
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ---- 알림톡 모드 ---- */}
            {channelType === 'ALIMTALK' && (
              <>
                {templatesLoading ? (
                  <div className="flex items-center gap-2 py-3">
                    <div className="w-4 h-4 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                    <span className="text-[13px] text-gray-400">불러오는 중...</span>
                  </div>
                ) : (
                  <>
                    {/* 카카오 채널 선택 */}
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-semibold text-gray-500">카카오 채널</Label>
                      {kakaoChannels.length === 0 ? (
                        <div className="bg-amber-50 rounded-lg p-3 text-center">
                          <p className="text-[13px] text-amber-700">연결된 카카오 채널이 없습니다.</p>
                          <p className="text-[12px] text-amber-500 mt-0.5">Solapi에서 카카오 채널을 먼저 연동해 주세요.</p>
                        </div>
                      ) : kakaoChannels.length === 1 ? (
                        <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2.5">
                          <span className="text-[14px]">💬</span>
                          <span className="text-[14px] font-medium text-amber-800">{kakaoChannels[0].channelName}</span>
                          <span className="text-[12px] text-amber-500">({kakaoChannels[0].searchId || kakaoChannels[0].pfId})</span>
                        </div>
                      ) : (
                        <Select value={selectedPfId} onValueChange={(v) => { if (v) setSelectedPfId(v) }}>
                          <SelectTrigger className="h-9 rounded-lg border-gray-200 text-[14px]">
                            <SelectValue placeholder="채널을 선택하세요" />
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
                      <Label className="text-[13px] font-semibold text-gray-500">알림톡 템플릿</Label>
                      {alimtalkTemplates.length === 0 ? (
                        <div className="bg-amber-50 rounded-lg p-3 text-center">
                          <p className="text-[13px] text-amber-700">등록된 알림톡 템플릿이 없습니다.</p>
                          <p className="text-[12px] text-amber-500 mt-0.5">Solapi에서 템플릿을 먼저 등록해 주세요.</p>
                        </div>
                      ) : (
                        <Select value={selectedTemplateId} onValueChange={(v) => { if (v) setSelectedTemplateId(v) }}>
                          <SelectTrigger className="h-9 rounded-lg border-gray-200 text-[14px]">
                            <SelectValue placeholder="템플릿을 선택하세요" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg max-h-60">
                            {alimtalkTemplates.map((t) => (
                              <SelectItem key={t.templateId} value={t.templateId} className="text-[14px]">
                                <div className="flex items-center gap-2">
                                  <span>{t.name}</span>
                                  <span className={`text-[11px] px-1.5 py-0.5 rounded ${t.status === 'APPROVED' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                    {t.status === 'APPROVED' ? '승인' : t.status}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </>
                )}

                {/* 알림톡 내용 (읽기 전용) */}
                {selectedTemplateId && template && (
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold text-gray-500">템플릿 내용 (수정 불가)</Label>
                    <div className="bg-gray-50 rounded-lg p-4 text-[14px] text-gray-700 whitespace-pre-wrap leading-relaxed border border-gray-100 min-h-[120px]">
                      {template}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ---- 친구톡(브랜드 메시지 자유유형) 모드 ---- */}
            {channelType === 'FRIENDTALK' && (
              <>
                {templatesLoading ? (
                  <div className="flex items-center gap-2 py-3">
                    <div className="w-4 h-4 border-2 border-yellow-300 border-t-yellow-600 rounded-full animate-spin" />
                    <span className="text-[13px] text-gray-400">불러오는 중...</span>
                  </div>
                ) : (
                  <>
                    {/* 카카오 채널 */}
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-semibold text-gray-500">카카오 채널</Label>
                      {kakaoChannels.length === 0 ? (
                        <div className="bg-yellow-50 rounded-lg p-3 text-center">
                          <p className="text-[13px] text-yellow-800">연결된 카카오 채널이 없습니다.</p>
                          <p className="text-[12px] text-yellow-600 mt-0.5">Solapi에서 카카오 채널을 먼저 연동해 주세요.</p>
                        </div>
                      ) : kakaoChannels.length === 1 ? (
                        <div className="flex items-center gap-2 bg-yellow-50 rounded-lg px-3 py-2.5">
                          <span className="text-[14px]">💛</span>
                          <span className="text-[14px] font-medium text-yellow-800">{kakaoChannels[0].channelName}</span>
                          <span className="text-[12px] text-yellow-600">({kakaoChannels[0].searchId || kakaoChannels[0].pfId})</span>
                        </div>
                      ) : (
                        <Select value={selectedPfId} onValueChange={(v) => { if (v) setSelectedPfId(v) }}>
                          <SelectTrigger className="h-9 rounded-lg border-gray-200 text-[14px]">
                            <SelectValue placeholder="채널을 선택하세요" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            {kakaoChannels.map((ch, idx) => (
                              <SelectItem key={`ft-${ch.pfId}-${idx}`} value={ch.pfId} className="text-[14px]">
                                {ch.channelName} ({ch.searchId || ch.pfId})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* 안내 */}
                    <div className="bg-yellow-50/50 border border-yellow-100 rounded-lg px-3 py-2 space-y-1">
                      <p className="text-[12px] text-yellow-700">브랜드 메시지 자유유형으로 발송됩니다. 채널 친구에게만 발송 가능합니다.</p>
                      <p className="text-[11px] text-yellow-600">발송 가능 시간: 매일 08:00 ~ 20:50</p>
                    </div>

                    {/* 메시지 내용 */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-[13px] font-semibold text-gray-500">메시지 내용</Label>
                        <span className="text-[12px] text-gray-400">{template.length} / 1,300 자</span>
                      </div>
                      <Textarea
                        ref={textareaRef}
                        placeholder={'메시지 내용을 입력하세요\n#{이름}님 형식으로 변수를 사용할 수 있습니다.'}
                        value={template}
                        onChange={(e) => { if (e.target.value.length <= 1300) setTemplate(e.target.value) }}
                        className="min-h-[200px] rounded-lg border-gray-200 text-[14px] focus-visible:ring-primary resize-y leading-relaxed"
                        rows={8}
                      />
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {AVAILABLE_VARIABLES.map((v) => (
                          <button
                            key={v.key}
                            type="button"
                            onClick={() => insertVariable(v.key)}
                            className="h-7 px-2.5 rounded-md text-[12px] font-medium border border-gray-200 hover:border-primary hover:text-primary transition-colors bg-white"
                          >
                            {'#{' + v.label + '}'}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={addCustomVariable}
                          className="h-7 px-2.5 rounded-md text-[12px] font-medium border border-dashed border-gray-300 hover:border-primary hover:text-primary transition-colors bg-white flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          변수 추가
                        </button>
                      </div>
                    </div>

                    {/* 문구 치환 */}
                    <VariableBindingBox
                      variables={variables}
                      bindings={variableBindings}
                      onChange={setVariableBindings}
                    />

                    {/* 발송실패 시 문자 대체발송 */}
                    <label className="flex items-center gap-2.5 bg-gray-50 rounded-lg px-3 py-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={friendTalkSmsFallback}
                        onChange={(e) => setFriendTalkSmsFallback(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-[13px] text-gray-600">발송실패 시 문자대체발송</span>
                    </label>
                  </>
                )}
              </>
            )}

            {/* ---- 이메일 모드 ---- */}
            {channelType === 'EMAIL' && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold text-gray-500">이메일 제목</Label>
                  <Input
                    placeholder="이메일 제목을 입력하세요"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="h-9 rounded-lg border-gray-200 text-[14px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold text-gray-500">이메일 본문</Label>
                  <Textarea
                    ref={textareaRef}
                    placeholder={`이메일 내용을 입력하세요\n#{이름}님 안녕하세요.`}
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    className="min-h-[240px] rounded-lg border-gray-200 text-[14px] focus-visible:ring-primary resize-y leading-relaxed"
                    rows={10}
                  />
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {AVAILABLE_VARIABLES.map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => insertVariable(v.key)}
                        className="h-7 px-2.5 rounded-md text-[12px] font-medium border border-gray-200 hover:border-primary hover:text-primary transition-colors bg-white"
                      >
                        {'#{' + v.label + '}'}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={addCustomVariable}
                      className="h-7 px-2.5 rounded-md text-[12px] font-medium border border-dashed border-gray-300 hover:border-primary hover:text-primary transition-colors bg-white flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      변수 추가
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 문구 치환 박스 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <VariableBindingBox
              variables={variables}
              bindings={variableBindings}
              onChange={setVariableBindings}
            />
            {variables.length === 0 && (
              <div className="bg-gray-50 rounded-lg border border-dashed border-gray-200 p-4 text-center">
                <p className="text-[13px] text-gray-400">내용에 변수가 없습니다.</p>
                <p className="text-[12px] text-gray-300 mt-1">
                  메시지에 {'#{이름}'} 등의 변수를 추가하면 리드별로 자동 치환됩니다.
                </p>
              </div>
            )}
          </div>

          {/* 광고 메시지 + 예약 발송 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            {/* 광고 메시지 여부 */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <Checkbox
                checked={isAd}
                onCheckedChange={(v) => setIsAd(v === true)}
                className="mt-0.5"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[14px] font-semibold text-gray-800">광고메시지 여부</span>
                </div>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  체크 시 제목에 (광고) 접두어가 자동으로 붙고, 본문 하단에 무료수신거부 안내가 추가됩니다.
                </p>
              </div>
            </label>

            {isAd && (
              <div className="bg-amber-50 rounded-lg px-3 py-2.5 text-[12px] text-amber-700 space-y-1">
                <p className="font-semibold">광고성 메시지 발송 시 필수 사항:</p>
                <p>1. 제목 앞에 (광고) 표기</p>
                <p>2. 본문 하단에 무료수신거부 번호 포함</p>
                <p>3. 야간 발송(21시~08시) 시 별도 수신 동의 필요</p>
              </div>
            )}

            <div className="border-t border-gray-100 pt-4" />

            {/* 예약 발송 */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <Checkbox
                checked={isScheduled}
                onCheckedChange={(v) => setIsScheduled(v === true)}
                className="mt-0.5"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[14px] font-semibold text-gray-800">예약 발송</span>
                </div>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  지정한 날짜와 시간에 자동으로 발송됩니다.
                </p>
              </div>
            </label>

            {isScheduled && (
              <div className="pl-7 space-y-2">
                <Label className="text-[13px] font-semibold text-gray-500">발송 예정 일시</Label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="h-9 rounded-lg border-gray-200 text-[14px] w-64"
                />
                {scheduledAt && (
                  <p className="text-[12px] text-primary font-medium">
                    {new Date(scheduledAt).toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    에 발송 예정
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 에러 */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
              <p className="text-[14px] text-red-600">{error}</p>
            </div>
          )}

          {/* 발송 버튼 */}
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={
              !template.trim() ||
              !hasRecipients ||
              (channelType === 'ALIMTALK' && (!selectedTemplateId || !selectedPfId)) ||
              (channelType === 'FRIENDTALK' && !selectedPfId) ||
              (isScheduled && !scheduledAt)
            }
            className="w-full h-12 rounded-lg text-[15px] font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
          >
            {isScheduled ? (
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                예약 발송
              </span>
            ) : (
              '즉시 발송'
            )}
          </Button>
        </div>
      </div>

      <SendConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        recipientCount={recipientCount}
        messageType={channelType === 'ALIMTALK' ? 'ATA' : channelType === 'FRIENDTALK' ? 'FT' : channelType === 'EMAIL' ? 'EMAIL' : smsMessageType}
        onConfirm={handleSend}
        loading={loading}
      />
    </div>
  )
}
