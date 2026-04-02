'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, Plus, Check, Building2 } from 'lucide-react'
import type { Workspace } from '@/types'

interface WorkspaceSwitcherProps {
  workspaces: Workspace[]
  currentWorkspaceId: string | null
}

const planLabels: Record<string, string> = {
  free: '무료',
  starter: 'Starter',
  pro: 'Pro',
}

export default function WorkspaceSwitcher({
  workspaces,
  currentWorkspaceId,
}: WorkspaceSwitcherProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-left group cursor-pointer bg-transparent border-0 outline-none">
          <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {currentWorkspace?.name?.[0]?.toUpperCase() ?? 'W'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-sidebar-foreground truncate">
              {currentWorkspace?.name ?? '워크스페이스 선택'}
            </p>
            {currentWorkspace && (
              <p className="text-[12px] text-muted-foreground">
                {planLabels[currentWorkspace.plan] ?? currentWorkspace.plan}
              </p>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 rounded-xl shadow-lg border border-gray-100 p-1.5"
        align="start"
        sideOffset={4}
      >
        {workspaces.length > 0 && (
          <>
            <p className="px-2 py-1.5 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
              내 워크스페이스
            </p>
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => {
                  router.push('/dashboard')
                  setOpen(false)
                }}
                className="flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer"
              >
                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-primary text-xs font-bold">
                    {workspace.name[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-gray-900 truncate">
                    {workspace.name}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {planLabels[workspace.plan] ?? workspace.plan}
                  </p>
                </div>
                {workspace.id === currentWorkspaceId && (
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="my-1.5" />
          </>
        )}

        <DropdownMenuItem
          onClick={() => {
            router.push('/workspace/new')
            setOpen(false)
          }}
          className="flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer text-primary"
        >
          <div className="flex-shrink-0 w-7 h-7 rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center">
            <Plus className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-[14px] font-medium">새 워크스페이스 만들기</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
