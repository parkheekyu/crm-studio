'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const PRESET_COLORS = [
  '#3182f6',
  '#f04452',
  '#ff9500',
  '#34c759',
  '#af52de',
  '#ff6482',
  '#007aff',
  '#5856d6',
]

interface GroupCreateModalProps {
  workspaceId: string
  onClose: () => void
  onCreated: () => void
}

export default function GroupCreateModal({
  workspaceId,
  onClose,
  onCreated,
}: GroupCreateModalProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: insertError } = await supabase
      .from('lead_groups')
      .insert({
        workspace_id: workspaceId,
        name: name.trim(),
        color,
      })

    if (insertError) {
      setError('그룹 생성에 실패했습니다.')
      setLoading(false)
      return
    }

    onCreated()
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[16px]">그룹 추가</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[14px] font-semibold text-gray-700">
              그룹 이름 <span className="text-red-500">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: VIP 고객, 서울 지역"
              className="h-10 rounded-lg border-gray-200 text-[14px]"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[14px] font-semibold text-gray-700">
              색상
            </Label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c
                      ? 'border-gray-900 scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-[13px] text-red-500">{error}</p>
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
              type="submit"
              disabled={!name.trim() || loading}
              className="flex-1 h-10 rounded-lg text-[14px] bg-primary hover:bg-primary/90"
            >
              {loading ? '생성 중...' : '그룹 생성'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
