'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface EnrollmentRow {
  id: string
  lead_id: string
  current_step: number
  status: string
  enrolled_at: string
  completed_at: string | null
  leads: { name: string; phone: string; email: string | null } | null
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: { label: '진행 중', className: 'bg-blue-50 text-blue-600' },
  completed: { label: '완료', className: 'bg-green-50 text-green-600' },
  cancelled: { label: '취소', className: 'bg-gray-100 text-gray-500' },
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

interface EnrollmentTableProps {
  enrollments: EnrollmentRow[]
  totalSteps: number
}

export default function EnrollmentTable({ enrollments, totalSteps }: EnrollmentTableProps) {
  if (enrollments.length === 0) {
    return (
      <div className="text-center py-12 text-[14px] text-gray-400">
        등록된 리드가 없습니다.
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
            <TableHead className="text-[13px] font-semibold text-gray-500 w-[100px]">진행</TableHead>
            <TableHead className="text-[13px] font-semibold text-gray-500 w-[80px]">상태</TableHead>
            <TableHead className="text-[13px] font-semibold text-gray-500 w-[110px]">등록일</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrollments.map((enrollment) => {
            const config = STATUS_CONFIG[enrollment.status] ?? STATUS_CONFIG.active
            return (
              <TableRow key={enrollment.id} className="hover:bg-gray-50/60 transition-colors">
                <TableCell className="text-[14px] font-medium text-gray-900 py-3">
                  {enrollment.leads?.name ?? '—'}
                </TableCell>
                <TableCell className="text-[14px] text-gray-600 py-3">
                  {enrollment.leads?.phone ?? '—'}
                </TableCell>
                <TableCell className="text-[13px] text-gray-500 py-3">
                  {enrollment.status === 'completed'
                    ? `${totalSteps}/${totalSteps}`
                    : `${enrollment.current_step}/${totalSteps}`
                  }
                </TableCell>
                <TableCell className="py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[12px] font-medium ${config.className}`}>
                    {config.label}
                  </span>
                </TableCell>
                <TableCell className="text-[13px] text-gray-400 py-3">
                  {formatDate(enrollment.enrolled_at)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
