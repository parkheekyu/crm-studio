'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { CampaignPerformance } from '@/types/analytics'

const TYPE_LABELS: Record<string, string> = {
  SMS: 'SMS',
  LMS: 'LMS',
  ATA: '알림톡',
  FTA: '친구톡',
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function rateColor(rate: number) {
  if (rate >= 90) return 'text-green-600'
  if (rate >= 70) return 'text-yellow-600'
  return 'text-red-500'
}

interface CampaignTableProps {
  campaigns: CampaignPerformance[]
}

export default function CampaignTable({ campaigns }: CampaignTableProps) {
  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12 text-[13px] text-gray-400">
        발송된 캠페인이 없습니다.
      </div>
    )
  }

  return (
    <div className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
            <TableHead className="text-[12px] font-semibold text-gray-500">캠페인명</TableHead>
            <TableHead className="text-[12px] font-semibold text-gray-500 w-[70px]">유형</TableHead>
            <TableHead className="text-[12px] font-semibold text-gray-500 w-[70px] text-right">전체</TableHead>
            <TableHead className="text-[12px] font-semibold text-gray-500 w-[70px] text-right">성공</TableHead>
            <TableHead className="text-[12px] font-semibold text-gray-500 w-[70px] text-right">실패</TableHead>
            <TableHead className="text-[12px] font-semibold text-gray-500 w-[80px] text-right">성공률</TableHead>
            <TableHead className="text-[12px] font-semibold text-gray-500 w-[100px]">발송일</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((c) => (
            <TableRow key={c.id} className="hover:bg-gray-50/60 transition-colors">
              <TableCell className="text-[13px] font-medium text-gray-900 py-3">
                {c.name}
              </TableCell>
              <TableCell className="text-[12px] text-gray-500 py-3">
                {TYPE_LABELS[c.messageType] ?? c.messageType}
              </TableCell>
              <TableCell className="text-[13px] text-gray-700 py-3 text-right">
                {c.totalCount}
              </TableCell>
              <TableCell className="text-[13px] text-green-600 py-3 text-right">
                {c.successCount}
              </TableCell>
              <TableCell className="text-[13px] text-red-500 py-3 text-right">
                {c.failCount}
              </TableCell>
              <TableCell className={`text-[13px] font-semibold py-3 text-right ${rateColor(c.successRate)}`}>
                {c.successRate}%
              </TableCell>
              <TableCell className="text-[12px] text-gray-400 py-3">
                {formatDate(c.sentAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
