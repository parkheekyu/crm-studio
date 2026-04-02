'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ScenarioPerformance } from '@/types/analytics'

interface ScenarioTableProps {
  scenarios: ScenarioPerformance[]
}

export default function ScenarioTable({ scenarios }: ScenarioTableProps) {
  if (scenarios.length === 0) {
    return (
      <div className="text-center py-12 text-[13px] text-gray-400">
        등록된 시나리오가 없습니다.
      </div>
    )
  }

  return (
    <div className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
            <TableHead className="text-[12px] font-semibold text-gray-500">시나리오명</TableHead>
            <TableHead className="text-[12px] font-semibold text-gray-500 w-[70px]">상태</TableHead>
            <TableHead className="text-[12px] font-semibold text-gray-500 w-[70px] text-right">등록</TableHead>
            <TableHead className="text-[12px] font-semibold text-gray-500 w-[70px] text-right">완료</TableHead>
            <TableHead className="text-[12px] font-semibold text-gray-500 w-[80px] text-right">완료율</TableHead>
            <TableHead className="text-[12px] font-semibold text-gray-500 w-[80px] text-right">발송 성공</TableHead>
            <TableHead className="text-[12px] font-semibold text-gray-500 w-[80px] text-right">발송 실패</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scenarios.map((s) => (
            <TableRow key={s.id} className="hover:bg-gray-50/60 transition-colors">
              <TableCell className="text-[13px] font-medium text-gray-900 py-3">
                {s.name}
              </TableCell>
              <TableCell className="py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${
                  s.isActive
                    ? 'bg-green-50 text-green-600'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {s.isActive ? '활성' : '비활성'}
                </span>
              </TableCell>
              <TableCell className="text-[13px] text-gray-700 py-3 text-right">
                {s.enrollmentCount}
              </TableCell>
              <TableCell className="text-[13px] text-gray-700 py-3 text-right">
                {s.completedCount}
              </TableCell>
              <TableCell className="text-[13px] font-semibold text-primary py-3 text-right">
                {s.completionRate}%
              </TableCell>
              <TableCell className="text-[13px] text-green-600 py-3 text-right">
                {s.totalLogsSent}
              </TableCell>
              <TableCell className="text-[13px] text-red-500 py-3 text-right">
                {s.totalLogsFailed}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
