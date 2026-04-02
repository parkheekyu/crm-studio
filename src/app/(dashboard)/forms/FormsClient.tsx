'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import FormCard from '@/components/forms/FormCard'
import type { LandingForm } from '@/types'

interface FormsClientProps {
  workspaceId: string
  forms: LandingForm[]
}

export default function FormsClient({ workspaceId, forms }: FormsClientProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">랜딩 폼</h2>
          <p className="mt-1 text-[14px] text-gray-500">
            외부 공개 폼으로 리드를 자동 수집합니다. 총 {forms.length}개
          </p>
        </div>
        <Link href="/forms/new">
          <Button className="h-10 px-4 rounded-lg text-[14px] font-semibold bg-primary hover:bg-primary/90 gap-1.5">
            <Plus className="w-4 h-4" />
            폼 만들기
          </Button>
        </Link>
      </div>

      {/* 폼 목록 */}
      {forms.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-[14px] text-gray-400">
            아직 만든 폼이 없습니다. 첫 번째 폼을 만들어 보세요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((form) => (
            <FormCard key={form.id} form={form} />
          ))}
        </div>
      )}
    </div>
  )
}
