'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExternalLink, Coins, Phone, MessageCircle, FileText, CheckCircle2, AlertCircle, Loader2, Link2 } from 'lucide-react'

interface SolapiConnectPanelProps {
  workspaceId: string
}

type ConnectionStatus = 'loading' | 'connected' | 'disconnected'

const PAGE_LINKS = [
  { key: '충전', icon: Coins, label: '충전하기', color: 'text-primary', bg: 'bg-primary/10' },
  { key: '발신번호', icon: Phone, label: '발신번호 등록', color: 'text-blue-500', bg: 'bg-blue-50' },
  { key: '카카오채널', icon: MessageCircle, label: '카카오 채널 연동', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { key: '알림톡템플릿', icon: FileText, label: '알림톡 템플릿', color: 'text-amber-600', bg: 'bg-amber-50' },
] as const

export default function SolapiConnectPanel({ workspaceId }: SolapiConnectPanelProps) {
  const [status, setStatus] = useState<ConnectionStatus>('loading')
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openingPage, setOpeningPage] = useState<string | null>(null)
  const [senderPhone, setSenderPhone] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)
  const [phoneSaved, setPhoneSaved] = useState(false)

  const checkConnection = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('workspace_integrations')
      .select('config')
      .eq('workspace_id', workspaceId)
      .eq('provider', 'solapi_sso')
      .single()

    const config = data?.config as any
    if (config?.account_id) {
      setStatus('connected')
      setSenderPhone(config.sender_phone ?? '')
    } else {
      setStatus('disconnected')
    }
  }, [workspaceId])

  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  const handleConnect = async () => {
    setConnecting(true)
    setError(null)
    try {
      const res = await fetch('/api/solapi/sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '연동에 실패했습니다.')
      setStatus('connected')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setConnecting(false)
    }
  }

  const handleSavePhone = async () => {
    if (!senderPhone.trim()) return
    setSavingPhone(true)
    setPhoneSaved(false)
    const supabase = createClient()
    const { data } = await supabase
      .from('workspace_integrations')
      .select('config')
      .eq('workspace_id', workspaceId)
      .eq('provider', 'solapi_sso')
      .single()
    const config = (data?.config as any) ?? {}
    await supabase.from('workspace_integrations').upsert({
      workspace_id: workspaceId,
      provider: 'solapi_sso',
      config: { ...config, sender_phone: senderPhone.trim() } as any,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id,provider' })
    setSavingPhone(false)
    setPhoneSaved(true)
  }

  const handleOpenPage = async (pageKey: string) => {
    setOpeningPage(pageKey)
    setError(null)
    try {
      const res = await fetch('/api/solapi/page-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, page: pageKey }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '페이지를 열 수 없습니다.')
      window.open(data.url, '_blank', 'noopener,noreferrer')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setOpeningPage(null)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <p className="text-[12px] text-red-600">{error}</p>
        </div>
      )}

      {status === 'disconnected' ? (
        /* 미연동 상태 */
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <Link2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[13px] font-medium text-gray-700">발송 서비스 연동 필요</p>
              <p className="text-[12px] text-gray-400 mt-0.5">
                연동하면 충전, 발신번호 등록, 카카오 채널 설정을 이 서비스에서 바로 이용할 수 있습니다.
              </p>
            </div>
          </div>
          <Button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full h-10 rounded-xl text-[13px] font-semibold bg-primary hover:bg-primary/90"
          >
            {connecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                연동 중...
              </>
            ) : (
              '발송 서비스 연동하기'
            )}
          </Button>
        </div>
      ) : (
        /* 연동 완료 상태 */
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2.5">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            <p className="text-[13px] font-medium text-green-700">발송 서비스가 연동되어 있습니다.</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {PAGE_LINKS.map((link) => (
              <button
                key={link.key}
                type="button"
                disabled={openingPage === link.key}
                onClick={() => handleOpenPage(link.key)}
                className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-left"
              >
                <div className={`w-8 h-8 rounded-lg ${link.bg} flex items-center justify-center shrink-0`}>
                  {openingPage === link.key ? (
                    <Loader2 className={`w-4 h-4 ${link.color} animate-spin`} />
                  ) : (
                    <link.icon className={`w-4 h-4 ${link.color}`} />
                  )}
                </div>
                <span className="text-[13px] font-medium text-gray-700">{link.label}</span>
                <ExternalLink className="w-3 h-3 text-gray-300 ml-auto" />
              </button>
            ))}
          </div>

          {/* 발신번호 설정 */}
          <div className="pt-2 border-t border-gray-100 space-y-2">
            <p className="text-[12px] font-semibold text-gray-600">발신번호</p>
            <p className="text-[11px] text-gray-400">마이사이트에서 등록한 발신번호를 입력하세요.</p>
            <div className="flex gap-2">
              <Input
                placeholder="01012345678"
                value={senderPhone}
                onChange={(e) => { setSenderPhone(e.target.value); setPhoneSaved(false) }}
                className="h-9 rounded-lg border-gray-200 text-[13px] font-mono flex-1"
              />
              <Button
                onClick={handleSavePhone}
                disabled={!senderPhone.trim() || savingPhone}
                className="h-9 px-4 rounded-lg text-[13px] font-semibold bg-primary hover:bg-primary/90 shrink-0"
              >
                {savingPhone ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : phoneSaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : '저장'}
              </Button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConnect}
            disabled={connecting}
            className="w-full text-[12px] text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            {connecting ? '재연동 중...' : '연동 재시도'}
          </button>
        </div>
      )}
    </div>
  )
}
