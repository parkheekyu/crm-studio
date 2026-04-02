'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Copy, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Group {
  id: string
  name: string
  color: string | null
}

export default function WebhookConfigClient({ workspaceId, groups }: { workspaceId: string; groups: Group[] }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [groupId, setGroupId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const webhookUrl = createdId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook/${createdId}`
    : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: insertError } = await supabase
      .from('lead_sources')
      .insert({
        workspace_id: workspaceId,
        title: title.trim(),
        type: 'webhook',
        group_id: groupId || null,
      })
      .select('id')
      .single()

    if (insertError || !data) {
      setError('저장에 실패했습니다. 다시 시도해 주세요.')
      setLoading(false)
      return
    }

    setCreatedId(data.id)
    setLoading(false)
  }

  const handleCopy = async () => {
    if (!webhookUrl) return
    await navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/collect/new" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h2 className="text-xl font-bold text-gray-900">웹훅 연동</h2>
      </div>

      {!createdId ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="text-[15px] font-semibold text-gray-900">연동 정보</h3>
            <div className="space-y-1.5">
              <Label className="text-[14px] font-semibold text-gray-700">
                채널 이름 <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="예: Zapier 웹훅"
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

          <div className="bg-purple-50/60 rounded-lg border border-purple-100 p-5 space-y-2">
            <p className="text-[14px] font-semibold text-gray-800">웹훅 연동 방법</p>
            <ol className="text-[13px] text-gray-600 space-y-1 list-decimal pl-4">
              <li>채널 이름을 입력하고 생성하면 고유 웹훅 URL이 발급됩니다.</li>
              <li>외부 서비스(Zapier, Make 등)에서 해당 URL로 POST 요청을 보내세요.</li>
              <li>요청 본문에 <code className="bg-white px-1 rounded text-[12px]">name</code>, <code className="bg-white px-1 rounded text-[12px]">phone</code> 필드를 포함하세요.</li>
              <li>선택 필드: <code className="bg-white px-1 rounded text-[12px]">email</code>, <code className="bg-white px-1 rounded text-[12px]">source</code></li>
            </ol>
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
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '웹훅 생성'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="text-[15px] font-semibold text-gray-900">웹훅 URL이 생성되었습니다</h3>
            <p className="text-[13px] text-gray-500">아래 URL로 POST 요청을 보내면 리드가 자동 등록됩니다.</p>
            <div className="flex items-center gap-2">
              <Input
                value={webhookUrl ?? ''}
                readOnly
                className="h-10 rounded-lg border-gray-200 text-[13px] bg-gray-50 font-mono"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleCopy}
                className="h-10 px-3 rounded-lg border-gray-200 shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
              </Button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg border border-gray-100 p-5 space-y-2">
            <p className="text-[13px] font-semibold text-gray-700">요청 예시</p>
            <pre className="text-[12px] text-gray-600 bg-white rounded-lg p-3 border border-gray-100 overflow-x-auto">
{`curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"name": "홍길동", "phone": "010-1234-5678", "email": "test@email.com"}'`}
            </pre>
          </div>

          <Link href="/collect">
            <Button className="h-10 px-6 rounded-lg text-[14px] font-semibold bg-primary hover:bg-primary/90">
              목록으로 돌아가기
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
