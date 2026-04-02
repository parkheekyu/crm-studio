import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FormPublic from '../FormPublic'
import FacebookPixel from '@/components/forms/FacebookPixel'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function PreviewFormPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // 인증 확인 — 로그인한 사용자만 미리보기 가능
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // is_active 필터 없이 조회 (비활성 상태도 미리보기 가능)
  const { data: form } = await supabase
    .from('landing_forms')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!form) notFound()

  // 워크스페이스 멤버인지 확인
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .eq('workspace_id', form.workspace_id)
    .single()

  if (!membership) notFound()

  const images = (form.images as string[] | null) ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 미리보기 배너 */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center sticky top-0 z-50">
        <span className="text-[13px] font-semibold text-amber-700">
          미리보기 모드 — 실제 폼 제출은 되지 않습니다
        </span>
      </div>

      {/* 랜딩 이미지 */}
      {images.length > 0 && (
        <div className="w-full max-w-lg mx-auto">
          {images.map((url, i) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={i}
              src={url}
              alt={`${form.title} 이미지 ${i + 1}`}
              className="w-full"
            />
          ))}
        </div>
      )}

      {/* 폼 */}
      <div className="w-full max-w-md mx-auto px-4 py-8">
        <FormPublic
          form={form}
          thankYouType={(form as any).thank_you_type ?? 'default'}
          thankYouValue={(form as any).thank_you_value ?? null}
          isPreview
        />
        <p className="text-center text-[11px] text-gray-300 mt-6">
          Powered by CRM Studio
        </p>
      </div>

      {/* Facebook Pixel (미리보기에서는 비활성) */}
    </div>
  )
}
