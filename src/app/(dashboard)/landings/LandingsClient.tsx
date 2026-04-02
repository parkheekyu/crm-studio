'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Copy, Check, ExternalLink, Pencil, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import type { LandingForm } from '@/types'

interface LandingWithSource extends LandingForm {
  lead_sources: { id: string; title: string; type: string } | null
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

interface LandingsClientProps {
  workspaceId: string
  landings: LandingWithSource[]
}

export default function LandingsClient({ workspaceId, landings }: LandingsClientProps) {
  const router = useRouter()

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">랜딩페이지</h2>
          <p className="mt-1 text-[14px] text-gray-500">
            리드 수집 폼이 포함된 랜딩페이지를 관리합니다. 총 {landings.length}개
          </p>
        </div>
        <Link href="/landings/new">
          <Button className="h-10 px-4 rounded-lg text-[14px] font-semibold bg-primary hover:bg-primary/90 gap-1.5">
            <Plus className="w-4 h-4" />
            새 랜딩페이지
          </Button>
        </Link>
      </div>

      {/* 리스트 */}
      {landings.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-[14px] text-gray-400">
            아직 랜딩페이지가 없습니다. 첫 번째 랜딩페이지를 만들어 보세요.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm divide-y divide-gray-50">
          {landings.map((landing) => (
            <LandingRow key={landing.id} landing={landing} />
          ))}
        </div>
      )}
    </div>
  )
}

function LandingRow({ landing }: { landing: LandingWithSource }) {
  const router = useRouter()
  const [isActive, setIsActive] = useState(landing.is_active)
  const [copied, setCopied] = useState(false)
  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/f/${landing.slug}`

  const handleToggle = async (checked: boolean) => {
    setIsActive(checked)
    const supabase = createClient()
    await supabase.from('landing_forms').update({ is_active: checked }).eq('id', landing.id)
    router.refresh()
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors group">
      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
        <Globe className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <Link
          href={`/landings/${landing.id}/edit`}
          className="text-[14px] font-semibold text-gray-900 hover:text-primary transition-colors"
        >
          {landing.title}
        </Link>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[12px] text-gray-400">/f/{landing.slug}</span>
          {landing.lead_sources && (
            <>
              <span className="text-[12px] text-gray-300">·</span>
              <span className="text-[12px] text-primary font-medium">{landing.lead_sources.title}</span>
            </>
          )}
        </div>
      </div>
      <span className="text-[12px] text-gray-400">{formatDate(landing.created_at)}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors" title="URL 복사">
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
        </button>
        <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md hover:bg-gray-100 transition-colors" title="새 탭에서 열기">
          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
        </a>
        <Link href={`/landings/${landing.id}/edit`} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors" title="수정">
          <Pencil className="w-3.5 h-3.5 text-gray-400" />
        </Link>
      </div>
      <Switch checked={isActive} onCheckedChange={handleToggle} />
    </div>
  )
}
