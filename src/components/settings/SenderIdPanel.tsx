'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Phone, Plus, ExternalLink, RefreshCw, CheckCircle2, Clock, AlertCircle, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SenderId {
  phoneNumber: string
  status: string
  handleKey: string
}

interface SenderIdPanelProps {
  workspaceId: string
  currentSenderPhone: string
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  ACTIVE: { label: '인증완료', color: 'text-green-600 bg-green-50', icon: CheckCircle2 },
  PENDING: { label: '인증대기', color: 'text-amber-600 bg-amber-50', icon: Clock },
  EXPIRED: { label: '만료', color: 'text-red-500 bg-red-50', icon: AlertCircle },
  DUPLICATED: { label: '중복', color: 'text-gray-500 bg-gray-100', icon: AlertCircle },
}

export default function SenderIdPanel({ workspaceId, currentSenderPhone }: SenderIdPanelProps) {
  const router = useRouter()
  const [senderIds, setSenderIds] = useState<SenderId[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPhone, setSelectedPhone] = useState(currentSenderPhone)

  const fetchList = async () => {
    setLoading(true)
    const res = await fetch('/api/senderid/list')
    if (res.ok) {
      const data = await res.json()
      setSenderIds(data.senderIds ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchList() }, [])

  const handleRegister = async () => {
    const phone = phoneInput.replace(/[^0-9]/g, '')
    if (phone.length < 10) return
    setRegistering(true)
    setError(null)

    const res = await fetch('/api/senderid/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: phone }),
    })

    const data = await res.json()
    setRegistering(false)

    if (res.ok) {
      setPhoneInput('')
      setShowAdd(false)
      await fetchList()
    } else {
      setError(data.error ?? '등록에 실패했습니다.')
    }
  }

  const handleSelect = async (phone: string) => {
    setSelectedPhone(phone)
    const supabase = createClient()
    await supabase
      .from('workspace_integrations')
      .upsert({
        workspace_id: workspaceId,
        provider: 'solapi',
        config: { sender_phone: phone } as any,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'workspace_id,provider' })
    router.refresh()
  }

  const activeIds = senderIds.filter((s) => s.status === 'ACTIVE')
  const pendingIds = senderIds.filter((s) => s.status === 'PENDING')
  const otherIds = senderIds.filter((s) => s.status !== 'ACTIVE' && s.status !== 'PENDING')

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* 인증 완료된 번호 */}
          {activeIds.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[12px] font-semibold text-gray-400">사용 가능한 번호</p>
              {activeIds.map((s) => (
                <button
                  key={s.phoneNumber}
                  type="button"
                  onClick={() => handleSelect(s.phoneNumber)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors ${
                    selectedPhone === s.phoneNumber
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-[14px] font-medium text-gray-900">
                      {s.phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded text-green-600 bg-green-50">인증완료</span>
                    {selectedPhone === s.phoneNumber && (
                      <span className="text-[11px] font-semibold text-primary">사용 중</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 인증 대기 번호 */}
          {pendingIds.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[12px] font-semibold text-gray-400">인증 대기 중</p>
              {pendingIds.map((s) => (
                <div key={s.phoneNumber} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-amber-200 bg-amber-50/50">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="text-[14px] font-medium text-gray-900">
                      {s.phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}
                    </span>
                  </div>
                  <a
                    href="https://console.solapi.com/senderids"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 h-7 px-2.5 rounded-md text-[12px] font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 transition-colors"
                  >
                    본인인증
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
              <p className="text-[11px] text-amber-600">
                Solapi에서 PASS 본인인증을 완료한 후 아래 새로고침 버튼을 눌러주세요.
              </p>
            </div>
          )}

          {/* 빈 상태 */}
          {activeIds.length === 0 && pendingIds.length === 0 && (
            <div className="bg-gray-50 rounded-xl p-5 text-center">
              <Phone className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-[13px] text-gray-400">등록된 발신번호가 없습니다.</p>
            </div>
          )}

          {/* 새로고침 + 추가 버튼 */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={fetchList}
              className="h-9 px-3 rounded-lg text-[13px] font-semibold border-gray-200 gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              상태 새로고침
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAdd(true)}
              className="flex-1 h-9 rounded-lg text-[13px] font-semibold border-gray-200 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              발신번호 추가
            </Button>
          </div>

          {/* 추가 폼 */}
          {showAdd && (
            <div className="border border-gray-200 rounded-lg p-3 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold text-gray-700">전화번호</Label>
                <Input
                  placeholder="01012345678"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleRegister() } }}
                  className="h-9 rounded-lg border-gray-200 text-[14px]"
                />
                <p className="text-[11px] text-gray-400">등록 후 Solapi에서 PASS 본인인증이 필요합니다.</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <p className="text-[12px] text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => { setShowAdd(false); setError(null) }} className="h-8 px-3 rounded-md text-[12px] border-gray-200">취소</Button>
                <Button type="button" onClick={handleRegister} disabled={phoneInput.replace(/[^0-9]/g, '').length < 10 || registering} className="h-8 px-3 rounded-md text-[12px] font-semibold bg-primary hover:bg-primary/90">
                  {registering ? '등록 중...' : '등록'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
