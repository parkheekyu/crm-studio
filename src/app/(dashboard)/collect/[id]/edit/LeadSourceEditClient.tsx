'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Copy, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { LeadSource } from '@/types'

interface FormField {
  key: string
  label: string
  type: string
  required: boolean
}

interface Group {
  id: string
  name: string
  color: string | null
}

export default function LeadSourceEditClient({ source, groups }: { source: LeadSource; groups: Group[] }) {
  const router = useRouter()
  const [title, setTitle] = useState(source.title)
  const [fields, setFields] = useState<FormField[]>((source.fields as any) ?? [])
  const [includeEmail, setIncludeEmail] = useState(
    (source.fields as unknown as FormField[])?.some((f) => f.key === 'email') ?? false
  )
  const config = (source.config ?? {}) as any
  const [formId, setFormId] = useState(config.form_id ?? '')
  const [pageId, setPageId] = useState(config.page_id ?? '')
  const [sheetUrl, setSheetUrl] = useState(config.sheet_url ?? '')
  const [groupId, setGroupId] = useState<string>((source as any).group_id ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEmailToggle = (checked: boolean) => {
    setIncludeEmail(checked)
    const base: FormField[] = [
      { key: 'name', label: '이름', type: 'text', required: true },
      { key: 'phone', label: '전화번호', type: 'tel', required: true },
    ]
    if (checked) base.push({ key: 'email', label: '이메일', type: 'email', required: false })
    setFields(base)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const updateData: any = { title: title.trim(), group_id: groupId || null }

    if (source.type === 'form') {
      updateData.fields = fields
    } else if (source.type === 'facebook') {
      updateData.config = { form_id: formId.trim() || null, page_id: pageId.trim() || null }
    } else if (source.type === 'google_sheets') {
      updateData.config = { sheet_url: sheetUrl.trim() || null }
    }

    const { error: updateError } = await supabase
      .from('lead_sources')
      .update(updateData)
      .eq('id', source.id)

    if (updateError) {
      setError('저장에 실패했습니다.')
      setLoading(false)
      return
    }

    router.push('/collect')
    router.refresh()
  }

  const [copied, setCopied] = useState(false)
  const webhookUrl = source.type === 'webhook'
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook/${source.id}`
    : null

  const handleCopy = async () => {
    if (!webhookUrl) return
    await navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const typeLabel = source.type === 'facebook' ? '페이스북 인스턴트' : source.type === 'google_sheets' ? '구글 스프레드시트' : source.type === 'webhook' ? '웹훅' : '리드폼'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/collect" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{typeLabel} 수정</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[14px] font-semibold text-gray-700">채널 이름</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 rounded-lg border-gray-200 text-[14px] focus-visible:ring-primary"
              required
            />
          </div>

          {/* 그룹 배정 */}
          {groups.length > 0 && (
            <div className="space-y-1.5 pt-2">
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
          )}

          {/* 폼 타입: 필드 설정 */}
          {source.type === 'form' && (
            <div className="space-y-3 pt-2">
              <Label className="text-[14px] font-semibold text-gray-700">수집 필드</Label>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <p className="text-[14px] font-medium text-gray-700">이름</p>
                <span className="text-[12px] font-medium text-primary bg-blue-50 px-2 py-0.5 rounded-md">필수</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <p className="text-[14px] font-medium text-gray-700">전화번호</p>
                <span className="text-[12px] font-medium text-primary bg-blue-50 px-2 py-0.5 rounded-md">필수</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <p className="text-[14px] font-medium text-gray-700">이메일</p>
                <Switch checked={includeEmail} onCheckedChange={handleEmailToggle} />
              </div>
            </div>
          )}

          {/* Facebook 타입 */}
          {source.type === 'facebook' && (
            <>
              <div className="space-y-1.5">
                <Label className="text-[14px] font-semibold text-gray-700">Facebook 페이지 ID</Label>
                <Input value={pageId} onChange={(e) => setPageId(e.target.value)} className="h-10 rounded-lg border-gray-200 text-[14px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[14px] font-semibold text-gray-700">인스턴트 양식 ID</Label>
                <Input value={formId} onChange={(e) => setFormId(e.target.value)} className="h-10 rounded-lg border-gray-200 text-[14px]" />
              </div>
            </>
          )}

          {/* Sheets 타입 */}
          {source.type === 'google_sheets' && (
            <div className="space-y-1.5">
              <Label className="text-[14px] font-semibold text-gray-700">스프레드시트 URL</Label>
              <Input value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} className="h-10 rounded-lg border-gray-200 text-[14px]" />
            </div>
          )}

          {/* Webhook 타입 */}
          {source.type === 'webhook' && webhookUrl && (
            <div className="space-y-1.5">
              <Label className="text-[14px] font-semibold text-gray-700">웹훅 URL</Label>
              <div className="flex items-center gap-2">
                <Input value={webhookUrl} readOnly className="h-10 rounded-lg border-gray-200 text-[13px] bg-gray-50 font-mono" />
                <Button type="button" variant="outline" onClick={handleCopy} className="h-10 px-3 rounded-lg border-gray-200 shrink-0">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                </Button>
              </div>
              <p className="text-[12px] text-gray-400">이 URL로 POST 요청을 보내면 리드가 자동 등록됩니다.</p>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
            <p className="text-[14px] text-red-600">{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Link href="/collect" className="flex-1">
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
