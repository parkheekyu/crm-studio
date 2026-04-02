'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, ExternalLink, Pencil } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Switch } from '@/components/ui/switch'
import type { LandingForm } from '@/types'

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

interface FormCardProps {
  form: LandingForm
}

export default function FormCard({ form }: FormCardProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [isActive, setIsActive] = useState(form.is_active)
  const [toggling, setToggling] = useState(false)

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/f/${form.slug}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleToggle = async (checked: boolean) => {
    setToggling(true)
    setIsActive(checked)

    const supabase = createClient()
    const { error } = await supabase
      .from('landing_forms')
      .update({ is_active: checked })
      .eq('id', form.id)

    if (error) {
      setIsActive(!checked)
    }
    setToggling(false)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
      {/* 타이틀 + 활성 토글 */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-semibold text-gray-900 truncate">
            {form.title}
          </h3>
          {form.description && (
            <p className="text-[12px] text-gray-400 mt-0.5 line-clamp-1">
              {form.description}
            </p>
          )}
        </div>
        <Switch
          checked={isActive}
          onCheckedChange={handleToggle}
          disabled={toggling}
          className="ml-3 flex-shrink-0"
        />
      </div>

      {/* 공개 URL */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-gray-400 truncate flex-1">/f/{form.slug}</span>
        <button
          onClick={handleCopy}
          className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          title="URL 복사"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-gray-400" />
          )}
        </button>
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          title="새 탭에서 열기"
        >
          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
        </a>
      </div>

      {/* 메타 */}
      <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-50">
        <span>{formatDate(form.created_at)}</span>
        <div className="flex items-center gap-2">
          <Link
            href={`/forms/${form.id}/edit`}
            className="flex items-center gap-1 hover:text-gray-600 transition-colors"
          >
            <Pencil className="w-3 h-3" />
            수정
          </Link>
          <span className={isActive ? 'text-green-500 font-medium' : 'text-gray-300'}>
            {isActive ? '활성' : '비활성'}
          </span>
        </div>
      </div>
    </div>
  )
}
