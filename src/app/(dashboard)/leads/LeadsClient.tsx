'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import LeadList from '@/components/leads/LeadList'
import LeadCreateModal from '@/components/leads/LeadCreateModal'
import CsvUploadModal from '@/components/leads/CsvUploadModal'
import type { Lead, LeadGroup } from '@/types'

interface LeadWithGroups extends Lead {
  groups: { id: string; name: string; color: string | null }[]
}

interface LeadsClientProps {
  workspaceId: string
  leads: LeadWithGroups[]
  groups: LeadGroup[]
  formTitles?: string[]
}

export default function LeadsClient({ workspaceId, leads, groups, formTitles = [] }: LeadsClientProps) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [csvModalOpen, setCsvModalOpen] = useState(false)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">리드 관리</h2>
          <p className="mt-1 text-[14px] text-gray-500">총 {leads.length}명</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCsvModalOpen(true)}
            className="h-10 px-4 rounded-lg text-[14px] font-semibold border-gray-200 gap-1.5"
          >
            <Upload className="w-4 h-4" />
            CSV 업로드
          </Button>
          <Button
            onClick={() => setModalOpen(true)}
            className="h-10 px-4 rounded-lg text-[14px] font-semibold bg-primary hover:bg-primary/90 gap-1.5"
          >
            <Plus className="w-4 h-4" />
            리드 추가
          </Button>
        </div>
      </div>

      {/* 리드 목록 */}
      <LeadList leads={leads} allGroups={groups} workspaceId={workspaceId} />

      {/* 추가 모달 */}
      <LeadCreateModal
        workspaceId={workspaceId}
        groups={groups}
        formTitles={formTitles}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={() => router.refresh()}
      />

      <CsvUploadModal
        workspaceId={workspaceId}
        groups={groups}
        open={csvModalOpen}
        onOpenChange={setCsvModalOpen}
        onSuccess={() => router.refresh()}
      />
    </div>
  )
}
