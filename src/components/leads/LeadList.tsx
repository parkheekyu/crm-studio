'use client'

import { useState, useMemo } from 'react'
import { Search, Tag, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import GroupAssignModal from '@/components/leads/GroupAssignModal'
import type { Lead, LeadGroup } from '@/types'

interface LeadWithGroups extends Lead {
  groups: { id: string; name: string; color: string | null }[]
}

interface LeadListProps {
  leads: LeadWithGroups[]
  allGroups: LeadGroup[]
  workspaceId: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function LeadList({ leads, allGroups, workspaceId }: LeadListProps) {
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showAssign, setShowAssign] = useState(false)
  const [pageSize, setPageSize] = useState(50)
  const [page, setPage] = useState(1)

  let filtered = leads

  if (search.trim()) {
    const q = search.trim()
    filtered = filtered.filter(
      (l) => l.name.includes(q) || l.phone.includes(q)
    )
  }

  if (groupFilter) {
    filtered = filtered.filter((l) =>
      l.groups.some((g) => g.id === groupFilter)
    )
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  )

  const allSelected =
    paged.length > 0 && paged.every((l) => selectedIds.has(l.id))

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        for (const l of paged) next.delete(l.id)
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        for (const l of paged) next.add(l.id)
        return next
      })
    }
  }

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-4">
      {/* 검색 + 필터 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="이름 또는 전화번호로 검색"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 h-10 rounded-lg border-gray-200 text-[14px] focus-visible:ring-primary"
          />
        </div>
        {allGroups.length > 0 && (
          <select
            value={groupFilter}
            onChange={(e) => { setGroupFilter(e.target.value); setPage(1) }}
            className="h-10 rounded-lg border border-gray-200 px-3 text-[14px] text-gray-600 bg-white focus:ring-primary focus:border-primary"
          >
            <option value="">전체 그룹</option>
            {allGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
              <TableHead className="w-[40px]">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </TableHead>
              <TableHead className="text-[13px] font-semibold text-gray-500 w-[120px]">이름</TableHead>
              <TableHead className="text-[13px] font-semibold text-gray-500 w-[140px]">전화번호</TableHead>
              <TableHead className="text-[13px] font-semibold text-gray-500">이메일</TableHead>
              <TableHead className="text-[13px] font-semibold text-gray-500 w-[100px]">유입 경로</TableHead>
              <TableHead className="text-[13px] font-semibold text-gray-500 w-[140px]">그룹</TableHead>
              <TableHead className="text-[13px] font-semibold text-gray-500 w-[100px]">등록일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-[14px] text-gray-400">
                  {search || groupFilter ? '검색 결과가 없습니다.' : '아직 등록된 리드가 없습니다.'}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-gray-50/60 transition-colors">
                  <TableCell className="py-3.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(lead.id)}
                      onChange={() => toggleOne(lead.id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </TableCell>
                  <TableCell className="text-[14px] font-medium text-gray-900 py-3.5">
                    {lead.name}
                  </TableCell>
                  <TableCell className="text-[14px] text-gray-600 py-3.5">
                    {lead.phone}
                  </TableCell>
                  <TableCell className="text-[14px] text-gray-500 py-3.5">
                    {lead.email ?? <span className="text-gray-300">—</span>}
                  </TableCell>
                  <TableCell className="py-3.5">
                    {lead.source ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-[12px] font-medium text-blue-600">
                        {lead.source}
                      </span>
                    ) : (
                      <span className="text-[14px] text-gray-300">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {lead.groups.length > 0
                        ? lead.groups.map((g) => (
                            <span
                              key={g.id}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[12px] font-medium text-white"
                              style={{ backgroundColor: g.color ?? '#94a3b8' }}
                            >
                              {g.name}
                            </span>
                          ))
                        : <span className="text-[14px] text-gray-300">—</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-[14px] text-gray-400 py-3.5">
                    {formatDate(lead.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-gray-500">페이지당</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
              className="h-8 rounded-lg border border-gray-200 px-2 text-[13px] text-gray-700 bg-white"
            >
              {[10, 50, 100, 200].map((n) => (
                <option key={n} value={n}>{n}개</option>
              ))}
            </select>
            <span className="text-[13px] text-gray-400">
              총 {filtered.length}명 중 {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
              .reduce<(number | 'dot')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('dot')
                acc.push(p)
                return acc
              }, [])
              .map((item, i) =>
                item === 'dot' ? (
                  <span key={`dot-${i}`} className="w-8 h-8 flex items-center justify-center text-[13px] text-gray-300">…</span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item as number)}
                    className={`w-8 h-8 rounded-lg text-[13px] font-medium transition-colors ${
                      safePage === item
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* 선택 액션바 */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-gray-900 text-white rounded-xl shadow-2xl px-6 py-3 flex items-center gap-4">
            <span className="text-[14px] font-medium">
              {selectedIds.size}명 선택
            </span>
            <Button
              onClick={() => setShowAssign(true)}
              className="h-8 rounded-lg text-[13px] font-semibold bg-primary hover:bg-primary/90"
            >
              <Tag className="w-3.5 h-3.5 mr-1.5" />
              그룹에 추가
            </Button>
            <Button
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
              className="h-8 rounded-lg text-[13px] text-gray-300 hover:text-white hover:bg-gray-800"
            >
              선택 해제
            </Button>
          </div>
        </div>
      )}

      {/* 그룹 할당 모달 */}
      {showAssign && (
        <GroupAssignModal
          leadIds={Array.from(selectedIds)}
          groups={allGroups}
          workspaceId={workspaceId}
          onClose={() => {
            setShowAssign(false)
            setSelectedIds(new Set())
          }}
        />
      )}
    </div>
  )
}
