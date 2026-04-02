import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Key, ChevronRight } from 'lucide-react'
import LogoutButton from '@/components/auth/LogoutButton'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const initials =
    profile?.full_name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? profile?.email?.[0]?.toUpperCase() ?? 'U'

  const provider = user.app_metadata?.provider ?? 'unknown'
  const providerLabel =
    provider === 'kakao' ? '카카오' : provider === 'google' ? 'Google' : provider

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">계정 설정</h2>
        <p className="mt-1 text-[15px] text-gray-500">
          프로필 정보와 계정을 관리합니다.
        </p>
      </div>

      {/* 프로필 카드 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="w-16 h-16">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary text-white text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-[16px] font-bold text-gray-900">
              {profile?.full_name ?? '이름 없음'}
            </h3>
            <p className="text-[14px] text-gray-500">{profile?.email}</p>
            <Badge variant="secondary" className="mt-1 text-[12px] font-semibold">
              {providerLabel}로 로그인
            </Badge>
          </div>
        </div>

        <div className="space-y-2 border-t border-gray-50 pt-4">
          <div className="flex justify-between items-center py-2">
            <span className="text-[14px] text-gray-500">이름</span>
            <span className="text-[14px] font-medium text-gray-900">
              {profile?.full_name ?? '—'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-[14px] text-gray-500">이메일</span>
            <span className="text-[14px] font-medium text-gray-900">
              {profile?.email}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-[14px] text-gray-500">가입일</span>
            <span className="text-[14px] font-medium text-gray-900">
              {new Date(profile?.created_at ?? '').toLocaleDateString('ko-KR')}
            </span>
          </div>
        </div>
      </div>

      {/* API 키 관리 */}
      <Link
        href="/settings/api-keys"
        className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors"
      >
        <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
          <Key className="w-5 h-5 text-violet-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-[15px] font-semibold text-gray-900">API 키 관리</h3>
          <p className="text-[13px] text-gray-500 mt-0.5">
            외부 서비스에서 리드를 등록할 수 있는 API 키를 관리합니다.
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300" />
      </Link>

      {/* 로그아웃 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-[15px] font-semibold text-gray-900 mb-1">
          로그아웃
        </h3>
        <p className="text-[14px] text-gray-500 mb-4">
          현재 기기에서 로그아웃합니다.
        </p>
        <LogoutButton />
      </div>
    </div>
  )
}
