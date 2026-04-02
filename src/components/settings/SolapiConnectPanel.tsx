'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ExternalLink, Coins, Phone, MessageCircle, FileText, CheckCircle2, AlertCircle } from 'lucide-react'

const MYSITE_URL = process.env.NEXT_PUBLIC_SOLAPI_MYSITE_URL ?? 'https://pixelpage.solapi.com'

interface SolapiConnectPanelProps {
  workspaceId: string
}

export default function SolapiConnectPanel({ workspaceId }: SolapiConnectPanelProps) {
  const router = useRouter()
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasKeys, setHasKeys] = useState(false)

  // 기존 설정 로드
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('workspace_integrations')
      .select('config')
      .eq('workspace_id', workspaceId)
      .eq('provider', 'solapi')
      .single()
      .then(({ data }) => {
        const config = data?.config as any
        if (config?.api_key) {
          setApiKey(config.api_key)
          setApiSecret(config.api_secret ?? '')
          setHasKeys(true)
        }
      })
  }, [workspaceId])

  const handleSave = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) return
    setSaving(true)
    setError(null)
    setSaved(false)

    // API 키 유효성 테스트
    try {
      const res = await fetch(`${MYSITE_URL}/api/cash/v1/balance`, {
        headers: {
          Authorization: await buildHmacAuth(apiKey.trim(), apiSecret.trim()),
        },
      })
      if (!res.ok) {
        setError('API 키가 유효하지 않습니다. 마이사이트의 API 키를 확인해 주세요.')
        setSaving(false)
        return
      }
    } catch {
      setError('연결에 실패했습니다.')
      setSaving(false)
      return
    }

    const supabase = createClient()
    await supabase.from('workspace_integrations').upsert({
      workspace_id: workspaceId,
      provider: 'solapi',
      config: { api_key: apiKey.trim(), api_secret: apiSecret.trim() } as any,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id,provider' })

    setSaving(false)
    setSaved(true)
    setHasKeys(true)
    router.refresh()
  }

  const mysiteLinks = [
    { icon: Coins, label: '충전하기', path: '/dashboard', color: 'text-primary', bg: 'bg-primary/10' },
    { icon: Phone, label: '발신번호 등록', path: '/senderids', color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: MessageCircle, label: '카카오 채널 연동', path: '/kakao/channel', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { icon: FileText, label: '알림톡 템플릿', path: '/kakao/template', color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  return (
    <div className="space-y-5">
      {/* 1단계: 마이사이트 가입 */}
      <div className="space-y-2">
        <h4 className="text-[13px] font-semibold text-gray-700">1. 발송 서비스 가입</h4>
        <a
          href={MYSITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-colors"
        >
          <div>
            <p className="text-[14px] font-semibold text-gray-900">발송 서비스 바로가기</p>
            <p className="text-[12px] text-gray-400 mt-0.5">회원가입 후 충전, 발신번호, 카카오 채널을 설정하세요.</p>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-400 shrink-0" />
        </a>
      </div>

      {/* 2단계: API 키 입력 */}
      <div className="space-y-2">
        <h4 className="text-[13px] font-semibold text-gray-700">2. API 키 연동</h4>
        <p className="text-[12px] text-gray-400">
          발송 서비스에서 설정 → API Key 메뉴에서 키를 복사하여 입력하세요.
        </p>

        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-[12px] font-semibold text-gray-500">API Key</Label>
            <Input
              placeholder="NCS..."
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setSaved(false) }}
              className="h-9 rounded-lg border-gray-200 text-[13px] font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[12px] font-semibold text-gray-500">API Secret</Label>
            <Input
              type="password"
              placeholder="API Secret"
              value={apiSecret}
              onChange={(e) => { setApiSecret(e.target.value); setSaved(false) }}
              className="h-9 rounded-lg border-gray-200 text-[13px] font-mono"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <p className="text-[12px] text-red-600">{error}</p>
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
            <p className="text-[12px] text-green-600">연동되었습니다.</p>
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={!apiKey.trim() || !apiSecret.trim() || saving}
          className="w-full h-9 rounded-lg text-[13px] font-semibold bg-primary hover:bg-primary/90"
        >
          {saving ? '확인 중...' : hasKeys ? 'API 키 업데이트' : 'API 키 저장'}
        </Button>
      </div>

      {/* 3단계: 바로가기 */}
      {hasKeys && (
        <div className="space-y-2">
          <h4 className="text-[13px] font-semibold text-gray-700">3. 발송 설정</h4>
          <div className="grid grid-cols-2 gap-2">
            {mysiteLinks.map((link) => (
              <a
                key={link.path}
                href={`${MYSITE_URL}${link.path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg ${link.bg} flex items-center justify-center shrink-0`}>
                  <link.icon className={`w-4 h-4 ${link.color}`} />
                </div>
                <span className="text-[13px] font-medium text-gray-700">{link.label}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** HMAC-SHA256 인증 헤더 (클라이언트에서 테스트용) */
async function buildHmacAuth(apiKey: string, apiSecret: string): Promise<string> {
  const date = new Date().toISOString()
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(apiSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(date + salt))
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `HMAC-SHA256 ApiKey=${apiKey}, Date=${date}, salt=${salt}, Signature=${hex}`
}
