'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Group {
  id: string
  name: string
  color: string | null
}

export default function FacebookConfigClient({ workspaceId, groups }: { workspaceId: string; groups: Group[] }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [groupId, setGroupId] = useState<string>('')
  const [formId, setFormId] = useState('')
  const [pageId, setPageId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: insertError } = await supabase.from('lead_sources').insert({
      workspace_id: workspaceId,
      title: title.trim(),
      type: 'facebook',
      config: {
        form_id: formId.trim() || null,
        page_id: pageId.trim() || null,
      } as any,
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
        <h2 className="text-xl font-bold text-gray-900">페이스북 인스턴트 양식 연동</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="text-[15px] font-semibold text-gray-900">연동 정보</h3>

          <div className="space-y-1.5">
            <Label className="text-[14px] font-semibold text-gray-700">
              채널 이름 <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="예: 무료 상담 - Facebook"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 rounded-lg border-gray-200 text-[14px] focus-visible:ring-primary"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[14px] font-semibold text-gray-700">Facebook 페이지 ID</Label>
            <Input
              placeholder="예: 123456789012345"
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
              className="h-10 rounded-lg border-gray-200 text-[14px] focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[14px] font-semibold text-gray-700">인스턴트 양식 ID</Label>
            <Input
              placeholder="예: 987654321098765"
              value={formId}
              onChange={(e) => setFormId(e.target.value)}
              className="h-10 rounded-lg border-gray-200 text-[14px] focus-visible:ring-primary"
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

        {/* 가이드 */}
        <div className="bg-blue-50/60 rounded-lg border border-blue-100 p-5 space-y-2">
          <p className="text-[14px] font-semibold text-gray-800">연동 가이드</p>
          <ol className="text-[13px] text-gray-600 space-y-1 list-decimal pl-4">
            <li>Facebook 비즈니스 관리자에서 리드 광고 캠페인을 생성합니다.</li>
            <li>인스턴트 양식에서 양식 ID를 복사합니다.</li>
            <li>위 필드에 페이지 ID와 양식 ID를 입력합니다.</li>
            <li>Webhook 연동 설정은 별도 가이드를 참고해 주세요.</li>
          </ol>
          <a
            href="https://developers.facebook.com/docs/marketing-api/guides/lead-ads"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[13px] text-primary hover:underline mt-1"
          >
            Facebook 리드 광고 문서 <ExternalLink className="w-3 h-3" />
          </a>
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
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '저장하기'}
          </Button>
        </div>
      </form>
    </div>
  )
}
