'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { MessageLog } from '@/types'

function formatTime(dateStr: string | null) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: '대기', className: 'bg-gray-100 text-gray-500' },
  sent: { label: '발송', className: 'bg-green-50 text-green-600' },
  failed: { label: '실패', className: 'bg-red-50 text-red-500' },
}

interface MessageLogTableProps {
  logs: MessageLog[]
}

export default function MessageLogTable({ logs }: MessageLogTableProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-[14px] text-gray-400">
        발송 로그가 없습니다.
      </div>
    )
  }

  return (
    <div className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
            <TableHead className="text-[13px] font-semibold text-gray-500 w-[120px]">이름</TableHead>
            <TableHead className="text-[13px] font-semibold text-gray-500 w-[140px]">전화번호</TableHead>
            <TableHead className="text-[13px] font-semibold text-gray-500 w-[80px]">상태</TableHead>
            <TableHead className="text-[13px] font-semibold text-gray-500">에러</TableHead>
            <TableHead className="text-[13px] font-semibold text-gray-500 w-[150px]">발송 시간</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const statusConfig = STATUS_CONFIG[log.status] ?? STATUS_CONFIG.pending
            return (
              <TableRow key={log.id} className="hover:bg-gray-50/60 transition-colors">
                <TableCell className="text-[14px] font-medium text-gray-900 py-3">
                  {log.lead_name ?? '—'}
                </TableCell>
                <TableCell className="text-[14px] text-gray-600 py-3">
                  {log.phone}
                </TableCell>
                <TableCell className="py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[12px] font-medium ${statusConfig.className}`}
                  >
                    {statusConfig.label}
                  </span>
                </TableCell>
                <TableCell className="text-[13px] text-gray-400 py-3">
                  {log.error_message ?? '—'}
                </TableCell>
                <TableCell className="text-[13px] text-gray-400 py-3">
                  {formatTime(log.sent_at)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
