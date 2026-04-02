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

export default function SheetsConfigClient({ workspaceId, groups }: { workspaceId: string; groups: Group[] }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [groupId, setGroupId] = useState<string>('')
  const [sheetUrl, setSheetUrl] = useState('')
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
      type: 'google_sheets',
      config: {
        sheet_url: sheetUrl.trim() || null,
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
        <h2 className="text-xl font-bold text-gray-900">구글 스프레드시트 연동</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="text-[15px] font-semibold text-gray-900">연동 정보</h3>

          <div className="space-y-1.5">
            <Label className="text-[14px] font-semibold text-gray-700">
              채널 이름 <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="예: 상담 신청 - Google Sheets"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 rounded-lg border-gray-200 text-[14px] focus-visible:ring-primary"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[14px] font-semibold text-gray-700">스프레드시트 URL</Label>
            <Input
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              className="h-10 rounded-lg border-gray-200 text-[14px] focus-visible:ring-primary"
            />
            <p className="text-[12px] text-gray-400">
              첫 번째 행이 헤더(이름, 전화번호, 이메일)여야 합니다.
            </p>
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
        <div className="bg-green-50/60 rounded-lg border border-green-100 p-5 space-y-2">
          <p className="text-[14px] font-semibold text-gray-800">연동 가이드</p>
          <ol className="text-[13px] text-gray-600 space-y-1 list-decimal pl-4">
            <li>Google Sheets에서 리드 데이터가 포함된 시트를 준비합니다.</li>
            <li>첫 행에 이름, 전화번호, 이메일 헤더를 설정합니다.</li>
            <li>시트 URL을 위 필드에 붙여넣습니다.</li>
            <li>자동 동기화 설정은 별도 가이드를 참고해 주세요.</li>
          </ol>
          <a
            href="https://developers.google.com/sheets/api"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[13px] text-green-700 hover:underline mt-1"
          >
            Google Sheets API 문서 <ExternalLink className="w-3 h-3" />
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
