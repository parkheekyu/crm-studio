'use client'

import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import CampaignStatusBadge from './CampaignStatusBadge'
import type { Campaign } from '@/types'

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

const TYPE_LABELS: Record<string, string> = {
  SMS: '문자(SMS)',
  LMS: '장문(LMS)',
  ATA: '알림톡',
  FTA: '친구톡',
}

interface CampaignListProps {
  campaigns: Campaign[]
}

export default function CampaignList({ campaigns }: CampaignListProps) {
  if (campaigns.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
        <p className="text-[14px] text-gray-400">
          아직 만든 캠페인이 없습니다. 첫 번째 캠페인을 만들어 보세요.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
            <TableHead className="text-[13px] font-semibold text-gray-500">캠페인명</TableHead>
            <TableHead className="text-[13px] font-semibold text-gray-500 w-[100px]">유형</TableHead>
            <TableHead className="text-[13px] font-semibold text-gray-500 w-[80px]">상태</TableHead>
            <TableHead className="text-[13px] font-semibold text-gray-500 w-[130px] text-center">발송 결과</TableHead>
            <TableHead className="text-[13px] font-semibold text-gray-500 w-[100px]">생성일</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow key={campaign.id} className="hover:bg-gray-50/60 transition-colors">
              <TableCell className="py-3.5">
                <Link
                  href={`/campaigns/${campaign.id}`}
                  className="text-[14px] font-medium text-gray-900 hover:text-primary transition-colors"
                >
                  {campaign.name}
                </Link>
              </TableCell>
              <TableCell className="text-[13px] text-gray-500 py-3.5">
                {TYPE_LABELS[campaign.message_type] ?? campaign.message_type}
              </TableCell>
              <TableCell className="py-3.5">
                <CampaignStatusBadge status={campaign.status} />
              </TableCell>
              <TableCell className="py-3.5 text-center">
                {campaign.status === 'draft' ? (
                  <span className="text-[13px] text-gray-300">—</span>
                ) : (
                  <span className="text-[13px] text-gray-500">
                    <span className="text-green-500 font-medium">{campaign.success_count}</span>
                    {' / '}
                    <span className="text-red-400">{campaign.fail_count}</span>
                    {' / '}
                    {campaign.total_count}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-[13px] text-gray-400 py-3.5">
                {formatDate(campaign.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
