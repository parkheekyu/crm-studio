'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Lead } from '@/types'

export type TargetMode = 'all' | 'filtered' | 'manual'

export interface TargetFilter {
  mode: TargetMode
  lead_ids?: string[]
  source?: string
}

interface LeadSelectorProps {
  leads: Lead[]
  value: TargetFilter
  onChange: (filter: TargetFilter) => void
}

export default function LeadSelector({ leads, value, onChange }: LeadSelectorProps) {
  const [search, setSearch] = useState('')

  // 유입 경로 목록 추출
  const sources = useMemo(() => {
    const set = new Set(leads.map((l) => l.source).filter(Boolean) as string[])
    return [...set].sort()
  }, [leads])

  // 필터링된 리드 수
  const filteredCount = useMemo(() => {
    if (value.mode === 'all') return leads.length
    if (value.mode === 'filtered' && value.source) {
      return leads.filter((l) => l.source === value.source).length
    }
    if (value.mode === 'manual') return value.lead_ids?.length ?? 0
    return 0
  }, [leads, value])

  // 수동 선택 시 검색 필터
  const searchedLeads = useMemo(() => {
    if (!search.trim()) return leads
    return leads.filter(
      (l) => l.name.includes(search.trim()) || l.phone.includes(search.trim())
    )
  }, [leads, search])

  const selectedIds = new Set(value.lead_ids ?? [])

  const toggleLead = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange({ ...value, mode: 'manual', lead_ids: [...next] })
  }

  const toggleAll = () => {
    if (selectedIds.size === leads.length) {
      onChange({ ...value, mode: 'manual', lead_ids: [] })
    } else {
      onChange({ ...value, mode: 'manual', lead_ids: leads.map((l) => l.id) })
    }
  }

  return (
    <div className="space-y-4">
      {/* 모드 선택 */}
      <div className="space-y-2">
        {[
          { mode: 'all' as const, label: '전체 리드', desc: `${leads.length}명 전체에게 발송` },
          { mode: 'filtered' as const, label: '유입 경로 필터', desc: '특정 유입 경로의 리드만' },
          { mode: 'manual' as const, label: '직접 선택', desc: '리드를 하나씩 선택' },
        ].map((opt) => (
          <label
            key={opt.mode}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
              value.mode === opt.mode
                ? 'bg-blue-50 border border-blue-200'
                : 'bg-gray-50 border border-gray-100 hover:bg-gray-100'
            }`}
          >
            <input
              type="radio"
              name="targetMode"
              checked={value.mode === opt.mode}
              onChange={() => onChange({ mode: opt.mode })}
              className="accent-primary"
            />
            <div>
              <p className="text-[14px] font-medium text-gray-900">{opt.label}</p>
              <p className="text-[12px] text-gray-400">{opt.desc}</p>
            </div>
          </label>
        ))}
      </div>

      {/* 필터 모드: 유입 경로 선택 */}
      {value.mode === 'filtered' && (
        <div className="space-y-1.5">
          <Label className="text-[14px] font-semibold text-gray-700">유입 경로</Label>
          <Select
            value={value.source ?? ''}
            onValueChange={(v) => onChange({ ...value, source: v ?? '' })}
          >
            <SelectTrigger className="h-10 rounded-lg border-gray-200 text-[14px]">
              <SelectValue placeholder="유입 경로 선택" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              {sources.map((src) => (
                <SelectItem key={src} value={src} className="text-[14px]">
                  {src} ({leads.filter((l) => l.source === src).length}명)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 수동 모드: 체크박스 테이블 */}
      {value.mode === 'manual' && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="이름 또는 전화번호 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-lg border-gray-200 text-[14px] focus-visible:ring-primary"
            />
          </div>

          <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-100">
            {/* 전체 선택 */}
            <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border-b border-gray-100 sticky top-0">
              <Checkbox
                checked={selectedIds.size === leads.length && leads.length > 0}
                onCheckedChange={toggleAll}
              />
              <span className="text-[13px] font-medium text-gray-500">
                전체 선택 ({selectedIds.size}/{leads.length})
              </span>
            </div>

            {searchedLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors"
              >
                <Checkbox
                  checked={selectedIds.has(lead.id)}
                  onCheckedChange={() => toggleLead(lead.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-gray-900 truncate">
                    {lead.name}
                  </p>
                  <p className="text-[12px] text-gray-400">{lead.phone}</p>
                </div>
                {lead.source && (
                  <span className="text-[11px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-md">
                    {lead.source}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 선택된 수신자 수 */}
      <div className="text-[14px] text-gray-600">
        선택된 수신자: <span className="font-semibold text-primary">{filteredCount}명</span>
      </div>
    </div>
  )
}
