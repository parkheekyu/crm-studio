'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import TemplateEditor from '@/components/campaigns/TemplateEditor'

export interface VariableBinding {
  type: 'field' | 'fixed'
  value: string
}

export interface StepTargetFilter {
  type: 'all' | 'group' | 'source'
  group_id?: string
  source?: string
}

export interface StepData {
  delay_days: number
  message_type: string
  message_content: string
  template_id?: string
  variable_bindings?: Record<string, VariableBinding>
  scheduled_at?: string
  target_filter?: StepTargetFilter
  kakao_options?: { pf_id: string }
}

interface StepEditorProps {
  index: number
  step: StepData
  onChange: (step: StepData) => void
}

export default function StepEditor({
  index,
  step,
  onChange,
}: StepEditorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
        <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-[13px] font-bold flex items-center justify-center">
          {index + 1}
        </span>
        <span className="text-[15px] font-semibold text-gray-900">
          스텝 {index + 1} 편집
        </span>
      </div>

      {/* 발송 시점 */}
      <div className="space-y-1.5">
        <Label className="text-[13px] font-semibold text-gray-500">발송 시점</Label>
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-medium text-gray-700">D +</span>
          <Input
            type="number"
            min={0}
            value={step.delay_days}
            onChange={(e) => onChange({ ...step, delay_days: parseInt(e.target.value) || 0 })}
            className="w-20 h-9 rounded-lg border-gray-200 text-[14px] text-center"
          />
          <span className="text-[13px] text-gray-400">일 후 발송</span>
        </div>
      </div>

      {/* 메시지 편집 */}
      <div className="space-y-1.5">
        <Label className="text-[13px] font-semibold text-gray-500">메시지 내용</Label>
        <TemplateEditor
          value={step.message_content}
          onChange={(v) => onChange({ ...step, message_content: v })}
        />
      </div>
    </div>
  )
}
