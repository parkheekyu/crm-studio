'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Settings, LogOut, User } from 'lucide-react'
import type { Profile } from '@/types'

interface HeaderProps {
  title?: string
  profile: Profile | null
}

export default function Header({ title, profile }: HeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials =
    profile?.full_name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? profile?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-gray-100 bg-white">
      {/* 페이지 타이틀 */}
      <div>
        {title && (
          <h1 className="text-[15px] font-semibold text-gray-900">{title}</h1>
        )}
      </div>

      {/* 유저 영역 */}
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl hover:bg-gray-50 px-2 py-1.5 transition-colors cursor-pointer bg-transparent border-0 outline-none">
              <Avatar className="w-7 h-7">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary text-white text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-[13px] font-medium text-gray-900 leading-tight">
                  {profile?.full_name ?? '사용자'}
                </p>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {profile?.email}
                </p>
              </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-52 rounded-2xl shadow-lg border border-gray-100 p-1.5"
            align="end"
            sideOffset={4}
          >
            <div className="px-2 py-2 mb-1">
              <p className="text-[13px] font-semibold text-gray-900 truncate">
                {profile?.full_name ?? '사용자'}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {profile?.email}
              </p>
            </div>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              onClick={() => router.push('/settings')}
              className="flex items-center gap-2 px-2 py-2 rounded-xl cursor-pointer"
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span className="text-[13px]">계정 설정</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 px-2 py-2 rounded-xl cursor-pointer text-red-500 focus:text-red-500"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-[13px]">로그아웃</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
