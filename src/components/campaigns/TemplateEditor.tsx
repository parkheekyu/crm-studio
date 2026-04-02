'use client'

import { useRef } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { AVAILABLE_VARIABLES, getByteLength, detectMessageType } from '@/lib/campaigns/variables'

interface TemplateEditorProps {
  value: string
  onChange: (value: string) => void
}

export default function TemplateEditor({ value, onChange }: TemplateEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertVariable = (varKey: string) => {
    const el = textareaRef.current
    if (!el) return

    const token = `#{${varKey}}`
    const start = el.selectionStart
    const end = el.selectionEnd
    const newValue = value.slice(0, start) + token + value.slice(end)
    onChange(newValue)

    // 커서 위치 복원
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + token.length, start + token.length)
    })
  }

  const bytes = getByteLength(value)
  const msgType = detectMessageType(value)

  return (
    <div className="space-y-2">
      {/* 변수 삽입 버튼 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[12px] text-gray-400 mr-1">변수 삽입:</span>
        {AVAILABLE_VARIABLES.map((v) => (
          <Button
            key={v.key}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertVariable(v.key)}
            className="h-7 px-2.5 rounded-lg text-[12px] font-medium border-gray-200 hover:border-primary hover:text-primary"
          >
            {'#{' + v.label + '}'}
          </Button>
        ))}
      </div>

      {/* 텍스트 에리어 */}
      <Textarea
        ref={textareaRef}
        placeholder="메시지 내용을 입력하세요. 변수를 사용하면 리드별로 자동 치환됩니다."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[140px] rounded-lg border-gray-200 text-[14px] focus-visible:ring-primary resize-none"
        rows={6}
      />

      {/* 바이트 카운터 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`text-[12px] font-medium px-2 py-0.5 rounded-md ${
              msgType === 'SMS'
                ? 'bg-blue-50 text-blue-600'
                : 'bg-orange-50 text-orange-600'
            }`}
          >
            {msgType}
          </span>
          {msgType === 'LMS' && bytes <= 90 + 20 && (
            <span className="text-[12px] text-orange-400">
              90바이트 초과 시 LMS로 전환됩니다
            </span>
          )}
        </div>
        <span className="text-[12px] text-gray-400">
          {bytes} / {msgType === 'SMS' ? '90' : '2,000'} 바이트
        </span>
      </div>
    </div>
  )
}
