'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ImageUploader from '@/components/forms/ImageUploader'

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

interface LandingCreateClientProps {
  workspaceId: string
  formSources: { id: string; title: string }[]
  existingLandings: { id: string; title: string; slug: string }[]
}

export default function LandingCreateClient({
  workspaceId,
  formSources,
  existingLandings,
}: LandingCreateClientProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [selectedSourceId, setSelectedSourceId] = useState('')
  const [thankYouType, setThankYouType] = useState<'default' | 'url' | 'landing'>('default')
  const [thankYouValue, setThankYouValue] = useState('')
  const [pixelId, setPixelId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(val))
    }
  }

  const [savedId, setSavedId] = useState<string | null>(null)

  const saveLanding = async (activate: boolean) => {
    if (!title.trim() || !slug.trim()) return

    setLoading(true)
    setError(null)

    const supabase = createClient()

    // 연결된 lead_source의 fields 가져오기
    let fields: any[] = []
    if (selectedSourceId) {
      const { data: src } = await supabase
        .from('lead_sources')
        .select('fields')
        .eq('id', selectedSourceId)
        .single()
      fields = (src?.fields as any[]) ?? []
    }

    const payload = {
      workspace_id: workspaceId,
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      fields: fields as any,
      images: images as any,
      pixel_id: pixelId.trim() || null,
      lead_source_id: selectedSourceId || null,
      thank_you_type: thankYouType,
      thank_you_value: thankYouType !== 'default' ? thankYouValue.trim() || null : null,
      is_active: activate,
    }

    let resultError: any = null

    if (savedId) {
      // 이미 저장된 적 있으면 update
      const { error } = await supabase.from('landing_forms').update(payload).eq('id', savedId)
      resultError = error
    } else {
      // 최초 저장
      const { data, error } = await supabase.from('landing_forms').insert(payload).select('id').single()
      resultError = error
      if (data) setSavedId(data.id)
    }

    if (resultError) {
      if (resultError.message.includes('duplicate') || resultError.message.includes('unique')) {
        setError('이미 사용 중인 URL입니다. 다른 슬러그를 입력해 주세요.')
      } else {
        setError('저장에 실패했습니다. 다시 시도해 주세요.')
      }
      setLoading(false)
      return null
    }

    setLoading(false)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await saveLanding(true)
    if (result) {
      router.push('/landings')
      router.refresh()
    }
  }

  const handleSave = async () => {
    const result = await saveLanding(false)
    if (result) {
      setError(null)
    }
  }

  const handlePreview = async () => {
    // 먼저 저장(비활성 상태) 후 미리보기 열기
    const result = await saveLanding(false)
    if (result) {
      // 미리보기는 비활성이어도 볼 수 있도록 slug 기반으로 열기
      window.open(`/f/${slug.trim()}/preview`, '_blank')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/landings" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h2 className="text-xl font-bold text-gray-900">랜딩페이지 설정</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="text-[15px] font-semibold text-gray-900">기본 정보</h3>

          <div className="space-y-1.5">
            <Label className="text-[14px] font-semibold text-gray-700">
              페이지 제목 <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="예: 무료 상담 신청"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="h-10 rounded-lg border-gray-200 text-[14px] focus-visible:ring-primary"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[14px] font-semibold text-gray-700">
              URL 슬러그 <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-gray-400 shrink-0">/f/</span>
              <Input
                placeholder="my-page"
                value={slug}
                onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9가-힣-]/gi, '-').toLowerCase())}
                className="h-10 rounded-lg border-gray-200 text-[14px] focus-visible:ring-primary"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[14px] font-semibold text-gray-700">설명 (선택)</Label>
            <Textarea
              placeholder="폼 상단에 표시될 안내 문구"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-lg border-gray-200 text-[14px] focus-visible:ring-primary resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* 랜딩 이미지 */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900">랜딩 이미지</h3>
            <p className="text-[12px] text-gray-400 mt-1">상세페이지 이미지를 업로드하면 폼 위에 표시됩니다.</p>
          </div>
          <ImageUploader workspaceId={workspaceId} images={images} onImagesChange={setImages} />
        </div>

        {/* 리드폼 연결 */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900">리드폼 연결</h3>
            <p className="text-[12px] text-gray-400 mt-1">이 랜딩페이지에서 사용할 리드 수집 폼을 선택하세요.</p>
          </div>
          {formSources.length === 0 ? (
            <div className="text-[14px] text-gray-400 py-2">
              연결 가능한 리드폼이 없습니다.{' '}
              <Link href="/collect/new/form" className="text-primary hover:underline">폼 만들기</Link>
            </div>
          ) : (
            <Select value={selectedSourceId} onValueChange={(v) => setSelectedSourceId(v ?? '')}>
              <SelectTrigger className="h-10 rounded-lg border-gray-200 text-[14px]">
                <SelectValue placeholder="리드폼 선택" />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                {formSources.map((src) => (
                  <SelectItem key={src.id} value={src.id} className="text-[14px]">{src.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* 감사 페이지 */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900">감사 페이지</h3>
            <p className="text-[12px] text-gray-400 mt-1">폼 제출 후 보여줄 페이지를 설정합니다.</p>
          </div>
          <div className="flex gap-2">
            {(['default', 'url', 'landing'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => { setThankYouType(type); setThankYouValue('') }}
                className={`flex-1 px-3 py-2 rounded-lg text-[13px] font-medium border transition-colors ${
                  thankYouType === type
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {type === 'default' ? '기본 메시지' : type === 'url' ? 'URL 이동' : '랜딩페이지'}
              </button>
            ))}
          </div>
          {thankYouType === 'url' && (
            <Input
              placeholder="https://example.com/thank-you"
              value={thankYouValue}
              onChange={(e) => setThankYouValue(e.target.value)}
              className="h-10 rounded-lg border-gray-200 text-[14px]"
            />
          )}
          {thankYouType === 'landing' && (
            existingLandings.length === 0 ? (
              <p className="text-[13px] text-gray-400">선택 가능한 랜딩페이지가 없습니다.</p>
            ) : (
              <Select value={thankYouValue} onValueChange={(v) => setThankYouValue(v ?? '')}>
                <SelectTrigger className="h-10 rounded-lg border-gray-200 text-[14px]">
                  <SelectValue placeholder="랜딩페이지 선택" />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  {existingLandings.map((l) => (
                    <SelectItem key={l.id} value={l.slug} className="text-[14px]">{l.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          )}
        </div>

        {/* Facebook Pixel */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900">Facebook Pixel</h3>
            <p className="text-[12px] text-gray-400 mt-1">Pixel ID를 입력하면 PageView 및 Lead 전환을 추적합니다.</p>
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

        <div className="flex gap-2">
          <Link href="/landings">
            <Button type="button" variant="outline" disabled={loading} className="h-10 px-4 rounded-lg text-[14px] font-semibold border-gray-200">
              취소
            </Button>
          </Link>
          <div className="flex-1" />
          <Button
            type="button"
            variant="outline"
            disabled={!title.trim() || !slug.trim() || loading}
            onClick={handleSave}
            className="h-10 px-4 rounded-lg text-[14px] font-semibold border-gray-200"
          >
            저장
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!title.trim() || !slug.trim() || loading}
            onClick={handlePreview}
            className="h-10 px-4 rounded-lg text-[14px] font-semibold border-gray-200 gap-1.5"
          >
            <Eye className="w-4 h-4" />
            미리보기
          </Button>
          <Button type="submit" disabled={!title.trim() || !slug.trim() || loading} className="h-10 px-5 rounded-lg text-[14px] font-semibold bg-primary hover:bg-primary/90">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '활성화'}
          </Button>
        </div>
      </form>
    </div>
  )
}
