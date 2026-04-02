'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CampaignList from '@/components/campaigns/CampaignList'
import type { Campaign } from '@/types'

interface CampaignsClientProps {
  workspaceId: string
  campaigns: Campaign[]
}

export default function CampaignsClient({ workspaceId, campaigns }: CampaignsClientProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">CRM 발송</h2>
          <p className="mt-1 text-[14px] text-gray-500">총 {campaigns.length}개</p>
        </div>
        <Link href="/campaigns/new">
          <Button className="h-10 px-4 rounded-lg text-[14px] font-semibold bg-primary hover:bg-primary/90 gap-1.5">
            <Plus className="w-4 h-4" />
            새 캠페인
          </Button>
        </Link>
      </div>

      <CampaignList campaigns={campaigns} />
    </div>
  )
}
