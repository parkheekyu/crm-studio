import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 프로필 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 워크스페이스 목록 조회
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id, workspaces(*)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: true })

  const workspaces =
    memberships
      ?.map((m) => m.workspaces)
      .filter(Boolean)
      .flat() ?? []

  // 워크스페이스 없는 신규 유저 → 온보딩으로 리다이렉트
  // (workspace/new 페이지 자체는 제외)
  const currentWorkspaceId = workspaces[0]?.id ?? null

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        workspaces={workspaces as any}
        currentWorkspaceId={currentWorkspaceId}
      />
      <div className="flex-1 flex flex-col ml-60 min-h-0">
        <Header profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
