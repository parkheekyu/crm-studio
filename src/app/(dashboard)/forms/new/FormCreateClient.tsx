'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import ImageUploader from '@/components/forms/ImageUploader'

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

function generateSlug(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30)

  const rand = Math.random().toString(36).slice(2, 6)
  return base ? `${base}-${rand}` : rand
}

interface FormCreateClientProps {
  workspaceId: string
}

export default function FormCreateClient({ workspaceId }: FormCreateClientProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [fields, setFields] = useState<FormField[]>(DEFAULT_FIELDS)
  const [includeEmail, setIncludeEmail] = useState(true)
  const [images, setImages] = useState<string[]>([])
  const [pixelId, setPixelId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(val))
    }
  }

  const handleEmailToggle = (checked: boolean) => {
    setIncludeEmail(checked)
    if (checked) {
      setFields([
        ...DEFAULT_FIELDS.slice(0, 2),
        { key: 'email', label: '이메일', type: 'email', required: false },
      ])
    } else {
      setFields(DEFAULT_FIELDS.slice(0, 2))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !slug.trim()) return

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: insertError } = await supabase.from('landing_forms').insert({
      workspace_id: workspaceId,
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      fields: fields as any,
      images: images as any,
      pixel_id: pixelId.trim() || null,
      is_active: true,
    })

    if (insertError) {
      if (insertError.message.includes('duplicate') || insertError.message.includes('unique')) {
        setError('이미 사용 중인 URL입니다. 다른 슬러그를 입력해 주세요.')
      } else {
        setError('저장에 실패했습니다. 다시 시도해 주세요.')
      }
      setLoading(false)
      return
    }

    router.push('/forms')
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link
          href="/forms"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">폼 만들기</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 카드 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="text-[15px] font-semibold text-gray-900">기본 정보</h3>

          <div className="space-y-1.5">
            <Label htmlFor="form-title" className="text-[14px] font-semibold text-gray-700">
              폼 이름 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="form-title"
              placeholder="예: 무료 상담 신청"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="h-10 rounded-lg border-gray-200 text-[14px] focus-visible:ring-primary"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="form-slug" className="text-[14px] font-semibold text-gray-700">
              URL 슬러그 <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-gray-400 flex-shrink-0">/f/</span>
              <Input
                id="form-slug"
                placeholder="my-form"
                value={slug}
                onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9가-힣-]/gi, '-').toLowerCase())}
                className="h-10 rounded-lg border-gray-200 text-[14px] focus-visible:ring-primary"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="form-desc" className="text-[14px] font-semibold text-gray-700">
              설명 (선택)
            </Label>
            <Textarea
              id="form-desc"
              placeholder="폼 상단에 표시될 안내 문구"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-lg border-gray-200 text-[14px] focus-visible:ring-primary resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* 랜딩 이미지 카드 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900">랜딩 이미지</h3>
            <p className="text-[12px] text-gray-400 mt-1">
              상세페이지 이미지를 업로드하면 폼 위에 표시됩니다.
            </p>
          </div>
          <ImageUploader
            workspaceId={workspaceId}
            images={images}
            onImagesChange={setImages}
          />
        </div>

        {/* 폼 필드 설정 카드 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="text-[15px] font-semibold text-gray-900">수집 필드</h3>

          <div className="space-y-3">
            {/* 이름 — 항상 필수 */}
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-[14px] font-medium text-gray-700">이름</p>
                <p className="text-[12px] text-gray-400">필수 항목</p>
              </div>
              <span className="text-[12px] font-medium text-primary bg-blue-50 px-2 py-0.5 rounded-md">필수</span>
            </div>

            {/* 전화번호 — 항상 필수 */}
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-[14px] font-medium text-gray-700">전화번호</p>
                <p className="text-[12px] text-gray-400">필수 항목</p>
              </div>
              <span className="text-[12px] font-medium text-primary bg-blue-50 px-2 py-0.5 rounded-md">필수</span>
            </div>

            {/* 이메일 — 토글 */}
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-[14px] font-medium text-gray-700">이메일</p>
                <p className="text-[12px] text-gray-400">선택 항목</p>
              </div>
              <Switch
                checked={includeEmail}
                onCheckedChange={handleEmailToggle}
              />
            </div>
          </div>
        </div>

        {/* Facebook Pixel 카드 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900">Facebook Pixel</h3>
            <p className="text-[12px] text-gray-400 mt-1">
              Pixel ID를 입력하면 폼 페이지에서 PageView 및 Lead 전환을 추적합니다.
            </p>
          </div>
          <Input
            placeholder="예: 123456789012345"
            value={pixelId}
            onChange={(e) => setPixelId(e.target.value.replace(/\D/g, ''))}
            className="h-10 rounded-lg border-gray-200 text-[14px] focus-visible:ring-primary"
            maxLength={20}
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
            <p className="text-[14px] text-red-600">{error}</p>
          </div>
        )}

        {/* 액션 */}
        <div className="flex gap-2">
          <Link href="/forms" className="flex-1">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              className="w-full h-10 rounded-lg text-[14px] font-semibold border-gray-200"
            >
              취소
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={!title.trim() || !slug.trim() || loading}
            className="flex-1 h-10 rounded-lg text-[14px] font-semibold bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              '폼 생성하기'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
