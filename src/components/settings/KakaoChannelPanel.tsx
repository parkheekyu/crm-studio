'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X, MessageCircle, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface KakaoChannel {
  id: string
  pf_id: string
  search_id: string
  channel_name: string
}

interface KakaoChannelPanelProps {
  workspaceId: string
  channels: KakaoChannel[]
}

export default function KakaoChannelPanel({ workspaceId, channels: initialChannels }: KakaoChannelPanelProps) {
  const router = useRouter()
  const [channels, setChannels] = useState(initialChannels)
  const [showForm, setShowForm] = useState(false)

  // 연동 폼 상태
  const [searchId, setSearchId] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [categoryCode, setCategoryCode] = useState('00100010001')
  const [step, setStep] = useState<'input' | 'verify'>('input')
  const [channelId, setChannelId] = useState('')
  const [channelName, setChannelName] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleRequestToken = async () => {
    if (!searchId.trim() || !phoneNumber.trim()) return
    setLoading(true)
    setError(null)

    const res = await fetch('/api/kakao/channel/request-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId,
        searchId: searchId.trim(),
        phoneNumber: phoneNumber.trim().replace(/[^0-9]/g, ''),
        categoryCode,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      if (data.alreadyRegistered) {
        // 이미 등록된 채널 → 바로 완료
        setSuccess(true)
        setShowForm(false)
        resetForm()
        router.refresh()
      } else {
        setStep('verify')
      }
    } else {
      setError(data.error ?? '토큰 발송에 실패했습니다.')
    }
  }

  const handleVerify = async () => {
    if (!token.trim()) return
    setLoading(true)
    setError(null)

    const res = await fetch('/api/kakao/channel/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId,
        searchId: searchId.trim(),
        phoneNumber: phoneNumber.trim().replace(/[^0-9]/g, ''),
        categoryCode,
        token: token.trim(),
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      setSuccess(true)
      setShowForm(false)
      resetForm()
      router.refresh()
    } else {
      setError(data.error ?? '인증에 실패했습니다.')
    }
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from('workspace_kakao_channels').delete().eq('id', id)
    setChannels(channels.filter((ch) => ch.id !== id))
    router.refresh()
  }

  const resetForm = () => {
    setSearchId('')
    setPhoneNumber('')
    setToken('')
    setStep('input')
    setChannelId('')
    setError(null)
  }

  return (
    <div className="space-y-4">
      {/* 연동된 채널 목록 */}
      {channels.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-5 text-center">
          <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-[13px] text-gray-400">연동된 카카오 채널이 없습니다.</p>
          <p className="text-[12px] text-gray-400 mt-0.5">채널을 연동하면 알림톡/친구톡 발송이 가능합니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {channels.map((ch) => (
            <div key={ch.id} className="flex items-center justify-between bg-yellow-50 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="text-[16px]">💛</span>
                <div>
                  <p className="text-[14px] font-semibold text-gray-900">{ch.channel_name}</p>
                  <p className="text-[12px] text-gray-500">@{ch.search_id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(ch.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 채널 추가 버튼/폼 */}
      {!showForm ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => { setShowForm(true); resetForm() }}
          className="w-full h-10 rounded-xl text-[13px] font-semibold border-gray-200 gap-1.5"
        >
          <Plus className="w-4 h-4" />
          카카오 채널 연동
        </Button>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          {step === 'input' ? (
            <>
              <p className="text-[14px] font-semibold text-gray-900">카카오 채널 연동</p>
              <p className="text-[12px] text-gray-400">카카오톡 채널 관리자센터에서 검색용 아이디를 확인하세요.</p>

              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold text-gray-700">검색용 아이디</Label>
                <Input
                  placeholder="@채널아이디"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="h-9 rounded-lg border-gray-200 text-[13px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold text-gray-700">관리자 전화번호</Label>
                <Input
                  placeholder="01012345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="h-9 rounded-lg border-gray-200 text-[13px]"
                />
                <p className="text-[11px] text-gray-400">이 번호로 카카오톡 인증 메시지가 발송됩니다.</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <p className="text-[12px] text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="h-9 px-4 rounded-lg text-[13px] border-gray-200">취소</Button>
                <Button type="button" onClick={handleRequestToken} disabled={!searchId.trim() || !phoneNumber.trim() || loading} className="h-9 px-4 rounded-lg text-[13px] font-semibold bg-primary hover:bg-primary/90">
                  {loading ? '발송 중...' : '인증번호 발송'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[14px] font-semibold text-gray-900">인증번호 입력</p>
              <p className="text-[12px] text-gray-500">
                <span className="font-medium text-gray-700">{phoneNumber}</span>으로 발송된 인증번호를 입력해 주세요.
              </p>

              <Input
                placeholder="인증번호 (숫자)"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                className="h-10 rounded-lg border-gray-200 text-[15px] text-center tracking-widest font-mono"
                maxLength={6}
                autoFocus
              />

              {error && (
                <div className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <p className="text-[12px] text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep('input')} className="h-9 px-4 rounded-lg text-[13px] border-gray-200">뒤로</Button>
                <Button type="button" onClick={handleVerify} disabled={!token.trim() || loading} className="h-9 px-4 rounded-lg text-[13px] font-semibold bg-primary hover:bg-primary/90">
                  {loading ? '인증 중...' : '연동 완료'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          <p className="text-[12px] text-green-600">카카오 채널이 연동되었습니다.</p>
        </div>
      )}
    </div>
  )
}
