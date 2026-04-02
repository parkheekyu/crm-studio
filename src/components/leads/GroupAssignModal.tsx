'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { LeadGroup } from '@/types'

interface GroupAssignModalProps {
  leadIds: string[]
  groups: LeadGroup[]
  workspaceId: string
  onClose: () => void
}

export default function GroupAssignModal({
  leadIds,
  groups,
  workspaceId,
  onClose,
}: GroupAssignModalProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const toggle = (groupId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  const handleSubmit = async () => {
    if (selected.size === 0) return
    setLoading(true)

    const supabase = createClient()

    for (const groupId of selected) {
      const memberships = leadIds.map((leadId) => ({
        group_id: groupId,
        lead_id: leadId,
      }))

      await supabase
        .from('lead_group_memberships')
        .upsert(memberships, { onConflict: 'group_id,lead_id', ignoreDuplicates: true })

      // 그룹 기반 시나리오 등록
      await fetch('/api/leads/enroll-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_ids: leadIds,
          workspace_id: workspaceId,
          group_id: groupId,
        }),
      }).catch(() => {})
    }

    setLoading(false)
    router.refresh()
    onClose()
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[16px]">
            그룹에 추가 ({leadIds.length}명)
          </DialogTitle>
        </DialogHeader>

        {groups.length === 0 ? (
          <p className="text-[14px] text-gray-500 py-4 text-center">
            생성된 그룹이 없습니다. 먼저 그룹을 만들어주세요.
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {groups.map((group) => (
              <label
                key={group.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(group.id)}
                  onChange={() => toggle(group.id)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: group.color ?? '#94a3b8' }}
                />
                <span className="text-[14px] font-medium text-gray-700">
                  {group.name}
                </span>
              </label>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 h-10 rounded-lg text-[14px]"
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selected.size === 0 || loading || groups.length === 0}
            className="flex-1 h-10 rounded-lg text-[14px] bg-primary hover:bg-primary/90"
          >
            {loading ? '추가 중...' : `${selected.size}개 그룹에 추가`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
