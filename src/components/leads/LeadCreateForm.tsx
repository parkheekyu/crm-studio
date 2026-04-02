'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { LeadGroup } from '@/types'

interface LeadCreateFormProps {
  workspaceId: string
  groups?: LeadGroup[]
  formTitles?: string[]
  onSuccess: () => void
  onCancel: () => void
}

export default function LeadCreateForm({
  workspaceId,
  groups = [],
  formTitles = [],
  onSuccess,
  onCancel,
}: LeadCreateFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [source, setSource] = useState('')
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleGroup = (id: string) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: lead, error: insertError } = await supabase.from('leads').insert({
      workspace_id: workspaceId,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      source: source || null,
    }).select('id').single()

    if (insertError) {
      setError('저장에 실패했습니다. 다시 시도해 주세요.')
      setLoading(false)
      return
    }

    // 그룹 멤버십 추가 + 그룹 시나리오 등록
    if (lead && selectedGroupIds.size > 0) {
      const memberships = Array.from(selectedGroupIds).map((gid) => ({
        group_id: gid,
        lead_id: lead.id,
      }))
      await supabase.from('lead_group_memberships').insert(memberships)

      for (const gid of selectedGroupIds) {
        fetch('/api/leads/enroll-group', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead_ids: [lead.id], workspace_id: workspaceId, group_id: gid }),
        }).catch(() => {})
      }
    }

    // 시나리오 자동 등록 (소스 기반)
    if (lead) {
      fetch('/api/leads/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_ids: [lead.id], workspace_id: workspaceId }),
      }).catch(() => {})
    }

    router.refresh()
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-1.5">
        <Label htmlFor="lead-name" className="text-[14px] font-semibold text-gray-700">
          이름 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="lead-name"
          placeholder="홍길동"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-10 rounded-lg border-gray-200 text-[14px] focus-visible:ring-primary"
          required
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lead-phone" className="text-[14px] font-semibold text-gray-700">
          전화번호 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="lead-phone"
          placeholder="010-0000-0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="h-10 rounded-lg border-gray-200 text-[14px] focus-visible:ring-primary"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lead-email" className="text-[14px] font-semibold text-gray-700">
          이메일
        </Label>
        <Input
          id="lead-email"
          type="email"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-10 rounded-lg border-gray-200 text-[14px] focus-visible:ring-primary"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[14px] font-semibold text-gray-700">유입 경로</Label>
        {formTitles.length > 0 ? (
          <Select value={source} onValueChange={(v) => setSource(v ?? '')}>
            <SelectTrigger className="h-10 rounded-lg border-gray-200 text-[14px]">
              <SelectValue placeholder="선택 (선택사항)" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              {formTitles.map((title) => (
                <SelectItem key={title} value={title} className="text-[14px]">
                  {title}
                </SelectItem>
              ))}
              <SelectItem value="직접입력" className="text-[14px]">직접입력</SelectItem>
              <SelectItem value="기타" className="text-[14px]">기타</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Input
            placeholder="유입 경로 입력 (선택사항)"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="h-10 rounded-lg border-gray-200 text-[14px]"
          />
        )}
      </div>

      {groups.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-[14px] font-semibold text-gray-700">그룹 (선택)</Label>
          <div className="flex flex-wrap gap-1.5">
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGroup(g.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[13px] font-medium border transition-colors ${
                  selectedGroupIds.has(g.id)
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: g.color || '#9ca3af' }}
                />
                {g.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
          <p className="text-[14px] text-red-600">{error}</p>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 h-10 rounded-lg text-[14px] font-semibold border-gray-200"
        >
          취소
        </Button>
        <Button
          type="submit"
          disabled={!name.trim() || !phone.trim() || loading}
          className="flex-1 h-10 rounded-lg text-[14px] font-semibold bg-primary hover:bg-primary/90"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            '저장하기'
          )}
        </Button>
      </div>
    </form>
  )
}
