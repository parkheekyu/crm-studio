'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, FileText, Trash2, Webhook } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { LeadSource } from '@/types'

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function FacebookLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path d="M16.5 12.05h-2.7v7.95h-3.3v-7.95H8.5v-2.8h2v-1.6c0-2.1 0.9-3.4 3.4-3.4h2.1v2.8h-1.3c-1 0-1 .4-1 1.1v1.1h2.3l-.5 2.8z" fill="white" />
    </svg>
  )
}

function GoogleSheetsLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="#0F9D58" />
      <path d="M14 2v6h6" fill="#87CEAC" />
      <rect x="7" y="12" width="10" height="7" rx="0.5" fill="white" opacity="0.9" />
      <line x1="7" y1="14.5" x2="17" y2="14.5" stroke="#0F9D58" strokeWidth="0.5" />
      <line x1="7" y1="17" x2="17" y2="17" stroke="#0F9D58" strokeWidth="0.5" />
      <line x1="11" y1="12" x2="11" y2="19" stroke="#0F9D58" strokeWidth="0.5" />
    </svg>
  )
}

function SourceTypeLogo({ type }: { type: string }) {
  switch (type) {
    case 'facebook':
      return <FacebookLogo className="w-8 h-8" />
    case 'google_sheets':
      return <GoogleSheetsLogo className="w-8 h-8" />
    case 'webhook':
      return (
        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
          <Webhook className="w-4 h-4 text-purple-600" />
        </div>
      )
    default:
      return (
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <FileText className="w-4 h-4 text-primary" />
        </div>
      )
  }
}

function sourceTypeLabel(type: string) {
  switch (type) {
    case 'facebook': return '페이스북 인스턴트'
    case 'google_sheets': return '구글 스프레드시트'
    case 'webhook': return '웹훅'
    default: return '리드폼'
  }
}

interface GroupInfo {
  id: string
  name: string
  color: string | null
}

interface CollectClientProps {
  workspaceId: string
  sources: LeadSource[]
  groupMap: Record<string, GroupInfo>
}

export default function CollectClient({ workspaceId, sources, groupMap }: CollectClientProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('이 수집 채널을 삭제하시겠습니까?')) return
    setDeleting(id)
    const supabase = createClient()
    await supabase.from('lead_sources').delete().eq('id', id)
    router.refresh()
    setDeleting(null)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">리드 수집</h2>
          <p className="mt-1 text-[14px] text-gray-500">
            다양한 채널에서 리드를 수집합니다. 총 {sources.length}개
          </p>
        </div>
        <Link href="/collect/new">
          <Button className="h-10 px-4 rounded-lg text-[14px] font-semibold bg-primary hover:bg-primary/90 gap-1.5">
            <Plus className="w-4 h-4" />
            수집 채널 추가
          </Button>
        </Link>
      </div>

      {/* 리스트 */}
      {sources.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-[14px] text-gray-400">
            아직 수집 채널이 없습니다. 첫 번째 수집 채널을 추가해 보세요.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm divide-y divide-gray-50">
          {sources.map((source) => (
            <div
              key={source.id}
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors group"
            >
              <SourceTypeLogo type={source.type} />
              <div className="flex-1 min-w-0">
                <Link
                  href={`/collect/${source.id}/edit`}
                  className="text-[14px] font-semibold text-gray-900 hover:text-primary transition-colors"
                >
                  {source.title}
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[12px] text-gray-400">
                    {formatDate(source.created_at)}
                  </p>
                  {(source as any).group_id && groupMap[(source as any).group_id] && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: groupMap[(source as any).group_id].color ?? '#gray' }}
                      />
                      {groupMap[(source as any).group_id].name}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[12px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">
                {sourceTypeLabel(source.type)}
              </span>
              <button
                onClick={() => handleDelete(source.id)}
                disabled={deleting === source.id}
                className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
