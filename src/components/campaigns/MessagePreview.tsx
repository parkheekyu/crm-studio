'use client'

import { previewMessage } from '@/lib/campaigns/variables'
import type { Lead } from '@/types'

interface MessagePreviewProps {
  template: string
  lead: Lead | null
}

export default function MessagePreview({ template, lead }: MessagePreviewProps) {
  if (!template || !lead) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-100 p-6 text-center">
        <p className="text-[14px] text-gray-400">
          메시지 내용과 수신자를 선택하면 미리보기가 표시됩니다.
        </p>
      </div>
    )
  }

  const preview = previewMessage(template, lead)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-gray-400">수신자:</span>
        <span className="text-[13px] font-medium text-gray-700">
          {lead.name} ({lead.phone})
        </span>
      </div>

      {/* 폰 프리뷰 */}
      <div className="bg-gray-900 rounded-xl p-4 max-w-xs mx-auto">
        <div className="bg-white rounded-lg p-4">
          <p className="text-[14px] text-gray-900 whitespace-pre-wrap leading-relaxed">
            {preview}
          </p>
        </div>
        <p className="text-[11px] text-gray-500 text-center mt-2">미리보기</p>
      </div>
    </div>
  )
}
