'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import CampaignStatusBadge from '@/components/campaigns/CampaignStatusBadge'
import MessageLogTable from '@/components/campaigns/MessageLogTable'
import type { Campaign, MessageLog } from '@/types'

const TYPE_LABELS: Record<string, string> = {
  SMS: '문자(SMS)',
  LMS: '장문(LMS)',
  ATA: '알림톡',
  FTA: '친구톡',
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

interface CampaignDetailClientProps {
  campaign: Campaign
  logs: MessageLog[]
}

export default function CampaignDetailClient({ campaign, logs }: CampaignDetailClientProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link href="/campaigns" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{campaign.name}</h2>
        </div>
        <CampaignStatusBadge status={campaign.status} />
      </div>

      {/* 캠페인 정보 카드 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-[15px] font-semibold text-gray-900 mb-4">캠페인 정보</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-[12px] text-gray-400">메시지 유형</p>
            <p className="text-[15px] font-semibold text-gray-900 mt-0.5">
              {TYPE_LABELS[campaign.message_type] ?? campaign.message_type}
            </p>
          </div>
          <div>
            <p className="text-[12px] text-gray-400">전체</p>
            <p className="text-[15px] font-semibold text-gray-900 mt-0.5">
              {campaign.total_count}명
            </p>
          </div>
          <div>
            <p className="text-[12px] text-gray-400">성공</p>
            <p className="text-[15px] font-semibold text-green-600 mt-0.5">
              {campaign.success_count}명
            </p>
          </div>
          <div>
            <p className="text-[12px] text-gray-400">실패</p>
            <p className="text-[15px] font-semibold text-red-500 mt-0.5">
              {campaign.fail_count}명
            </p>
          </div>
        </div>

        {/* 메시지 내용 */}
        <div className="mt-4 pt-4 border-t border-gray-50">
          <p className="text-[12px] text-gray-400 mb-1">메시지 내용</p>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-[14px] text-gray-700 whitespace-pre-wrap">
              {campaign.message_content}
            </p>
          </div>
        </div>

        <div className="mt-3 flex gap-4 text-[12px] text-gray-400">
          <span>생성: {formatDate(campaign.created_at)}</span>
          {campaign.sent_at && <span>발송: {formatDate(campaign.sent_at)}</span>}
        </div>
      </div>

      {/* 발송 로그 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h3 className="text-[15px] font-semibold text-gray-900">
            발송 로그 ({logs.length}건)
          </h3>
        </div>
        <MessageLogTable logs={logs} />
      </div>
    </div>
  )
}
