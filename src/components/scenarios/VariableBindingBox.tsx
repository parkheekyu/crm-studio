'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { VariableBinding } from './StepEditor'

const LEAD_FIELDS = [
  { value: 'name', label: '이름 (leads.name)' },
  { value: 'phone', label: '전화번호 (leads.phone)' },
  { value: 'email', label: '이메일 (leads.email)' },
  { value: 'source', label: '유입경로 (leads.source)' },
  { value: 'notes', label: '메모 (leads.notes)' },
]

interface VariableBindingBoxProps {
  variables: string[]
  bindings: Record<string, VariableBinding>
  onChange: (bindings: Record<string, VariableBinding>) => void
}

export default function VariableBindingBox({
  variables,
  bindings,
  onChange,
}: VariableBindingBoxProps) {
  if (variables.length === 0) return null

  const updateBinding = (varName: string, binding: VariableBinding) => {
    onChange({ ...bindings, [varName]: binding })
  }

  return (
    <div className="space-y-2">
      <p className="text-[13px] font-semibold text-gray-400">
        문구 치환 ({variables.length}개 변수)
      </p>
      <div className="bg-gray-50 rounded-lg p-3 space-y-3">
        {variables.map((varName) => {
          const binding = bindings[varName] ?? { type: 'field', value: '' }

          return (
            <div key={varName} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md whitespace-nowrap">
                  {'#{' + varName + '}'}
                </span>
                <span className="text-[12px] text-gray-300">→</span>
                <Select
                  value={binding.type}
                  onValueChange={(v) => {
                    if (!v) return
                    updateBinding(varName, { type: v as 'field' | 'fixed', value: '' })
                  }}
                >
                  <SelectTrigger className="h-7 w-24 rounded-md border-gray-200 text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="field" className="text-[12px]">DB 컬럼</SelectItem>
                    <SelectItem value="fixed" className="text-[12px]">고정값</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {binding.type === 'field' ? (
                <Select
                  value={binding.value}
                  onValueChange={(v) => {
                    if (!v) return
                    updateBinding(varName, { type: 'field', value: v })
                  }}
                >
                  <SelectTrigger className="h-8 rounded-md border-gray-200 text-[13px]">
                    <SelectValue placeholder="DB 컬럼 선택" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {LEAD_FIELDS.map((f) => (
                      <SelectItem key={f.value} value={f.value} className="text-[13px]">
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="치환할 고정값을 입력하세요"
                  value={binding.value}
                  onChange={(e) =>
                    updateBinding(varName, { type: 'fixed', value: e.target.value })
                  }
                  className="h-8 rounded-md border-gray-200 text-[13px]"
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
