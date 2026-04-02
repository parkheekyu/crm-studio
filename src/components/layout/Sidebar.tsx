'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Users,
  FileText,
  Send,
  Tag,
  Inbox,
  Globe,
  Zap,
  BarChart2,
  Settings,
  Coins,
  MessageCircle,
} from 'lucide-react'
import WorkspaceSwitcher from '@/components/workspace/WorkspaceSwitcher'
import type { Workspace } from '@/types'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  disabled?: boolean
  badge?: string
}

const navItems: NavItem[] = [
  {
    label: '대시보드',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: '리드 관리',
    href: '/leads',
    icon: Users,
  },
  {
    label: '리드 그룹',
    href: '/groups',
    icon: Tag,
  },
  {
    label: '리드 수집',
    href: '/collect',
    icon: Inbox,
  },
  {
    label: '랜딩페이지',
    href: '/landings',
    icon: Globe,
  },
  {
    label: '메시지 발송',
    href: '/campaigns',
    icon: Send,
  },
  {
    label: '시나리오',
    href: '/scenarios',
    icon: Zap,
  },
  {
    label: '성과 분석',
    href: '/analytics',
    icon: BarChart2,
  },
]

interface SidebarProps {
  workspaces: Workspace[]
  currentWorkspaceId: string | null
}

export default function Sidebar({ workspaces, currentWorkspaceId }: SidebarProps) {
  const pathname = usePathname()
  const [creditBalance, setCreditBalance] = useState<number | null>(null)

  useEffect(() => {
    if (!currentWorkspaceId) return
    fetch(`/api/credits/balance?workspace_id=${currentWorkspaceId}`)
      .then((r) => r.json())
      .then((d) => setCreditBalance(d.balance ?? 0))
      .catch(() => {})
  }, [currentWorkspaceId])

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-sidebar border-r border-sidebar-border flex flex-col z-30">
      {/* 로고 */}
      <div className="px-4 py-5 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="font-bold text-[16px] text-gray-900 tracking-tight">
            CRM Studio
          </span>
        </Link>
      </div>

      {/* 워크스페이스 전환 */}
      <div className="px-3 py-3 border-b border-sidebar-border">
        <WorkspaceSwitcher
          workspaces={workspaces}
          currentWorkspaceId={currentWorkspaceId}
        />
      </div>

      {/* 내비게이션 */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.disabled ? '#' : item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-gray-900',
                item.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
              )}
              onClick={(e) => item.disabled && e.preventDefault()}
            >
              <Icon
                className={cn(
                  'w-4 h-4 flex-shrink-0',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* 하단 크레딧 + 설정 */}
      <div className="px-3 py-3 border-t border-sidebar-border space-y-0.5">
        {/* 크레딧 잔액 */}
        {currentWorkspaceId && (
          <Link
            href={`/workspace/${currentWorkspaceId}/settings`}
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors mb-1"
          >
            <div className="flex items-center gap-2">
              <Coins className="w-3.5 h-3.5 text-primary" />
              <span className="text-[12px] font-semibold text-primary">크레딧</span>
            </div>
            <span className="text-[13px] font-bold text-primary">
              {creditBalance !== null ? `${creditBalance.toLocaleString()}원` : '—'}
            </span>
          </Link>
        )}

        {/* 워크스페이스 설정 */}
        {currentWorkspaceId && (
          <Link
            href={`/workspace/${currentWorkspaceId}/settings`}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors',
              pathname.includes('/workspace/') && pathname.includes('/settings')
                ? 'bg-sidebar-accent text-primary'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-gray-900'
            )}
          >
            <MessageCircle className="w-4 h-4 text-muted-foreground" />
            발송 설정
          </Link>
        )}

        {/* 계정 설정 */}
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors',
            pathname === '/settings'
              ? 'bg-sidebar-accent text-primary'
              : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-gray-900'
          )}
        >
          <Settings className="w-4 h-4 text-muted-foreground" />
          계정 설정
        </Link>
      </div>
    </aside>
  )
}
