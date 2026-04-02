'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import LeadCreateForm from './LeadCreateForm'
import type { LeadGroup } from '@/types'

interface LeadCreateModalProps {
  workspaceId: string
  groups?: LeadGroup[]
  formTitles?: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function LeadCreateModal({
  workspaceId,
  groups,
  formTitles,
  open,
  onOpenChange,
  onSuccess,
}: LeadCreateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] rounded-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-bold text-gray-900">
            리드 추가
          </DialogTitle>
        </DialogHeader>
        <LeadCreateForm
          workspaceId={workspaceId}
          groups={groups}
          formTitles={formTitles}
          onSuccess={() => {
            onOpenChange(false)
            onSuccess()
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
