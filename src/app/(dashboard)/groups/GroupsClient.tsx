'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import GroupCreateModal from '@/components/groups/GroupCreateModal'
import type { LeadGroup } from '@/types'

interface GroupWithCount extends LeadGroup {
  memberCount: number
}

interface GroupsClientProps {
  workspaceId: string
  groups: GroupWithCount[]
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function GroupsClient({
  workspaceId,
  groups: initialGroups,
}: GroupsClientProps) {
  const router = useRouter()
  const [groups, setGroups] = useState(initialGroups)
  const [showCreate, setShowCreate] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('이 그룹을 삭제하시겠습니까? 그룹에 속한 리드는 삭제되지 않습니다.')) return
    setDeleting(id)

    const supabase = createClient()
    const { error } = await supabase
      .from('lead_groups')
      .delete()
      .eq('id', id)

    if (!error) {
      setGroups((prev) => prev.filter((g) => g.id !== id))
    }
    setDeleting(null)
  }

  const handleCreated = () => {
    setShowCreate(false)
    router.refresh()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">리드 그룹</h2>
          <p className="text-[14px] text-gray-500 mt-1">
            리드를 그룹으로 분류하고 시나리오와 연결하세요.
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="h-9 rounded-lg text-[14px] font-semibold bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          그룹 추가
        </Button>
      </div>

      {/* 그룹 목록 */}
      {groups.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-[15px] font-medium text-gray-500">
            아직 생성된 그룹이 없습니다.
          </p>
          <p className="text-[13px] text-gray-400 mt-1">
            그룹을 만들어 리드를 분류하세요.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4"
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: group.color ?? '#94a3b8' }}
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-semibold text-gray-900">
                  {group.name}
                </h3>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[13px] text-gray-400">
                    {group.memberCount}명
                  </span>
                  <span className="text-[13px] text-gray-400">
                    {formatDate(group.created_at)}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                disabled={deleting === group.id}
                onClick={() => handleDelete(group.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* 생성 모달 */}
      {showCreate && (
        <GroupCreateModal
          workspaceId={workspaceId}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
