'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
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
import type { LandingForm } from '@/types'

interface LandingWithExtra extends LandingForm {
  lead_source_id: string | null
  thank_you_type: string
  thank_you_value: string | null
}

interface LandingEditClientProps {
  landing: LandingWithExtra
  formSources: { id: string; title: string }[]
  existingLandings: { id: string; title: string; slug: string }[]
}

export default function LandingEditClient({
  landing,
  formSources,
  existingLandings,
}: LandingEditClientProps) {
  const router = useRouter()
  const [title, setTitle] = useState(landing.title)
  const [description, setDescription] = useState(landing.description ?? '')
  const [images, setImages] = useState<string[]>((landing.images as string[]) ?? [])
  const [selectedSourceId, setSelectedSourceId] = useState(landing.lead_source_id ?? '')
  const [thankYouType, setThankYouType] = useState<'default' | 'url' | 'landing'>(
    (landing.thank_you_type as any) ?? 'default'
  )
  const [thankYouValue, setThankYouValue] = useState(landing.thank_you_value ?? '')
  const [pixelId, setPixelId] = useState(landing.pixel_id ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    setError(null)

    const supabase = createClient()

    // 연결된 lead_source의 fields 가져오기
    let fields: any[] = (landing.fields as any[]) ?? []
    if (selectedSourceId) {
      const { data: src } = await supabase
        .from('lead_sources')
        .select('fields')
        .eq('id', selectedSourceId)
        .single()
      if (src) fields = (src.fields as any[]) ?? []
    }

    const { error: updateError } = await supabase
      .from('landing_forms')
      .update({
        title: title.trim(),
        description: description.trim() || null,
        images: images as any,
        fields: fields as any,
        pixel_id: pixelId.trim() || null,
        lead_source_id: selectedSourceId || null,
        thank_you_type: thankYouType,
        thank_you_value: thankYouType !== 'default' ? thankYouValue.trim() || null : null,
      })
      .eq('id', landing.id)

    if (updateError) {
      setError('저장에 실패했습니다.')
      setLoading(false)
      return
    }

    router.push('/landings')
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/landings" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h2 className="text-xl font-bold text-gray-900">랜딩페이지 수정</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="text-[15px] font-semibold text-gray-900">기본 정보</h3>

          <div className="space-y-1.5">
            <Label className="text-[14px] font-semibold text-gray-700">페이지 제목</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-10 rounded-lg border-gray-200 text-[14px]" required />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[14px] font-semibold text-gray-700">URL 슬러그</Label>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-gray-400 shrink-0">/f/</span>
              <Input value={landing.slug} disabled className="h-10 rounded-lg border-gray-200 text-[14px] bg-gray-50" />
            </div>
            <p className="text-[12px] text-gray-400">슬러그는 변경할 수 없습니다.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[14px] font-semibold text-gray-700">설명 (선택)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-lg border-gray-200 text-[14px] resize-none" rows={3} />
          </div>
        </div>

        {/* 이미지 */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="text-[15px] font-semibold text-gray-900">랜딩 이미지</h3>
          <ImageUploader workspaceId={landing.workspace_id} images={images} onImagesChange={setImages} />
        </div>

        {/* 리드폼 연결 */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="text-[15px] font-semibold text-gray-900">리드폼 연결</h3>
          {formSources.length === 0 ? (
            <p className="text-[14px] text-gray-400">연결 가능한 리드폼이 없습니다.</p>
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
          <h3 className="text-[15px] font-semibold text-gray-900">감사 페이지</h3>
          <div className="flex gap-2">
            {(['default', 'url', 'landing'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => { setThankYouType(type); setThankYouValue('') }}
                className={`flex-1 px-3 py-2 rounded-lg text-[13px] font-medium border transition-colors ${
                  thankYouType === type ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {type === 'default' ? '기본 메시지' : type === 'url' ? 'URL 이동' : '랜딩페이지'}
              </button>
            ))}
          </div>
          {thankYouType === 'url' && (
            <Input placeholder="https://example.com/thank-you" value={thankYouValue} onChange={(e) => setThankYouValue(e.target.value)} className="h-10 rounded-lg border-gray-200 text-[14px]" />
          )}
          {thankYouType === 'landing' && existingLandings.length > 0 && (
            <Select value={thankYouValue} onValueChange={(v) => setThankYouValue(v ?? '')}>
              <SelectTrigger className="h-10 rounded-lg border-gray-200 text-[14px]"><SelectValue placeholder="랜딩페이지 선택" /></SelectTrigger>
              <SelectContent className="rounded-lg">
                {existingLandings.map((l) => (<SelectItem key={l.id} value={l.slug} className="text-[14px]">{l.title}</SelectItem>))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Facebook Pixel */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="text-[15px] font-semibold text-gray-900">Facebook Pixel</h3>
          <Input placeholder="예: 123456789012345" value={pixelId} onChange={(e) => setPixelId(e.target.value.replace(/\D/g, ''))} className="h-10 rounded-lg border-gray-200 text-[14px]" maxLength={20} />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
            <p className="text-[14px] text-red-600">{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Link href="/landings" className="flex-1">
            <Button type="button" variant="outline" disabled={loading} className="w-full h-10 rounded-lg text-[14px] font-semibold border-gray-200">취소</Button>
          </Link>
          <Button type="submit" disabled={!title.trim() || loading} className="flex-1 h-10 rounded-lg text-[14px] font-semibold bg-primary hover:bg-primary/90">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '저장하기'}
          </Button>
        </div>
      </form>
    </div>
  )
}
