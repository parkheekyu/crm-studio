import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FormPublic from './FormPublic'
import FacebookPixel from '@/components/forms/FacebookPixel'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function PublicFormPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: form } = await supabase
    .from('landing_forms')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!form) notFound()

  const images = (form.images as string[] | null) ?? []

  return (
    <div className="min-h-screen bg-gray-50">
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
        />
        <p className="text-center text-[11px] text-gray-300 mt-6">
          Powered by CRM Studio
        </p>
      </div>

      {/* Facebook Pixel */}
      {form.pixel_id && <FacebookPixel pixelId={form.pixel_id} />}
    </div>
  )
}
