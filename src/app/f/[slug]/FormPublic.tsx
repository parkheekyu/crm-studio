'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { LandingForm } from '@/types'

interface FormField {
  key: string
  label: string
  type: string
  required: boolean
}

interface FormPublicProps {
  form: LandingForm
  thankYouType?: 'default' | 'url' | 'landing'
  thankYouValue?: string | null
  isPreview?: boolean
}

export default function FormPublic({ form, thankYouType = 'default', thankYouValue, isPreview = false }: FormPublicProps) {
  const fields = (form.fields as unknown as FormField[]) ?? []
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, '']))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isPreview) {
      setSubmitted(true)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/forms/${form.slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? '제출에 실패했습니다. 다시 시도해 주세요.')
        setLoading(false)
        return
      }

      // Facebook Pixel Lead 전환 이벤트
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Lead')
      }

      // 감사 페이지 분기
      if (thankYouType === 'url' && thankYouValue) {
        window.location.href = thankYouValue
        return
      }
      if (thankYouType === 'landing' && thankYouValue) {
        window.location.href = `/f/${thankYouValue}`
        return
      }

      setSubmitted(true)
    } catch {
      setError('네트워크 오류가 발생했습니다. 다시 시도해 주세요.')
    }

    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center space-y-3">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
        <h2 className="text-[18px] font-bold text-gray-900">제출 완료</h2>
        <p className="text-[13px] text-gray-500">
          감사합니다. 곧 연락드리겠습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      {/* 타이틀 */}
      <div>
        <h1 className="text-[18px] font-bold text-gray-900">{form.title}</h1>
        {form.description && (
          <p className="text-[13px] text-gray-500 mt-1">{form.description}</p>
        )}
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-[13px] font-semibold text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
            </Label>
            <Input
              type={field.type}
              placeholder={
                field.key === 'name' ? '홍길동' :
                field.key === 'phone' ? '010-0000-0000' :
                field.key === 'email' ? 'example@email.com' :
                ''
              }
              value={values[field.key] ?? ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              required={field.required}
              className="h-10 rounded-xl border-gray-200 text-[13px] focus-visible:ring-primary"
            />
          </div>
        ))}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
            <p className="text-[13px] text-red-600">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-10 rounded-xl text-[13px] font-semibold bg-primary hover:bg-primary/90"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            '제출하기'
          )}
        </Button>
      </form>
    </div>
  )
}
