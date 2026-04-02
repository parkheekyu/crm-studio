'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2 } from 'lucide-react'

interface SolapiSettingsFormProps {
  workspaceId: string
  initialSenderPhone: string
}

export default function SolapiSettingsForm({
  workspaceId,
  initialSenderPhone,
}: SolapiSettingsFormProps) {
  const router = useRouter()
  const [senderPhone, setSenderPhone] = useState(initialSenderPhone)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (!senderPhone.trim()) return
    setLoading(true)
    setSaved(false)

    const supabase = createClient()
    const { error } = await supabase
      .from('workspace_integrations')
      .upsert(
        {
          workspace_id: workspaceId,
          provider: 'solapi',
          config: { sender_phone: senderPhone.trim() } as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'workspace_id,provider' }
      )

    setLoading(false)
    if (!error) {
      setSaved(true)
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-[13px] font-semibold text-gray-700">
          발신번호 <span className="text-red-500">*</span>
        </Label>
        <Input
          placeholder="01012345678"
          value={senderPhone}
          onChange={(e) => setSenderPhone(e.target.value)}
          className="h-10 rounded-xl border-gray-200 text-[13px] focus-visible:ring-primary"
        />
        <p className="text-[11px] text-gray-400">
          SMS/LMS 발송에 사용할 발신번호를 입력해 주세요.
        </p>
      </div>

      {saved && (
        <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <p className="text-[13px] text-green-600">저장되었습니다.</p>
        </div>
      )}

      <Button
        type="button"
        onClick={handleSave}
        disabled={!senderPhone.trim() || loading}
        className="h-10 px-4 rounded-xl text-[13px] font-semibold bg-primary hover:bg-primary/90"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          '저장'
        )}
      </Button>
    </div>
  )
}
