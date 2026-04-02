'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface FormField {
  key: string
  label: string
  type: string
  required: boolean
}

const DEFAULT_FIELDS: FormField[] = [
  { key: 'name', label: '이름', type: 'text', required: true },
  { key: 'phone', label: '전화번호', type: 'tel', required: true },
  { key: 'email', label: '이메일', type: 'email', required: false },
]

interface Group {
  id: string
  name: string
  color: string | null
}

export default function LeadFormCreateClient({ workspaceId, groups }: { workspaceId: string; groups: Group[] }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [groupId, setGroupId] = useState<string>('')
  const [fields, setFields] = useState<FormField[]>(DEFAULT_FIELDS)
  const [includeEmail, setIncludeEmail] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEmailToggle = (checked: boolean) => {
    setIncludeEmail(checked)
    if (checked) {
      setFields([...DEFAULT_FIELDS.slice(0, 2), { key: 'email', label: '이메일', type: 'email', required: false }])
    } else {
      setFields(DEFAULT_FIELDS.slice(0, 2))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: insertError } = await supabase.from('lead_sources').insert({
      workspace_id: workspaceId,
      title: title.trim(),
      type: 'form',
      fields: fields as any,
      group_id: groupId || null,
    })

    if (insertError) {
      setError('저장에 실패했습니다. 다시 시도해 주세요.')
      setLoading(false)
      return
    }

    router.push('/collect')
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/collect/new" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h2 className="text-xl font-bold text-gray-900">리드폼 만들기</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="text-[15px] font-semibold text-gray-900">기본 정보</h3>
          <div className="space-y-1.5">
            <Label htmlFor="form-title" className="text-[14px] font-semibold text-gray-700">
              폼 이름 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="form-title"
              placeholder="예: 무료 상담 신청 폼"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 rounded-lg border-gray-200 text-[14px] focus-visible:ring-primary"
              required
              autoFocus
            />
          </div>
        </div>

        {/* 그룹 배정 */}
        {groups.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="text-[15px] font-semibold text-gray-900">리드 그룹 배정</h3>
            <div className="space-y-1.5">
              <Label className="text-[14px] font-semibold text-gray-700">수집 시 자동 배정할 그룹</Label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full h-10 rounded-lg border border-gray-200 text-[14px] px-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">선택 안 함</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* 수집 필드 */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="text-[15px] font-semibold text-gray-900">수집 필드</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-[14px] font-medium text-gray-700">이름</p>
                <p className="text-[12px] text-gray-400">필수 항목</p>
              </div>
              <span className="text-[12px] font-medium text-primary bg-blue-50 px-2 py-0.5 rounded-md">필수</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-[14px] font-medium text-gray-700">전화번호</p>
                <p className="text-[12px] text-gray-400">필수 항목</p>
              </div>
              <span className="text-[12px] font-medium text-primary bg-blue-50 px-2 py-0.5 rounded-md">필수</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-[14px] font-medium text-gray-700">이메일</p>
                <p className="text-[12px] text-gray-400">선택 항목</p>
              </div>
              <Switch checked={includeEmail} onCheckedChange={handleEmailToggle} />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
            <p className="text-[14px] text-red-600">{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Link href="/collect/new" className="flex-1">
            <Button type="button" variant="outline" disabled={loading} className="w-full h-10 rounded-lg text-[14px] font-semibold border-gray-200">
              취소
            </Button>
          </Link>
          <Button type="submit" disabled={!title.trim() || loading} className="flex-1 h-10 rounded-lg text-[14px] font-semibold bg-primary hover:bg-primary/90">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '폼 생성하기'}
          </Button>
        </div>
      </form>
    </div>
  )
}
