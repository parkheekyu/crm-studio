import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Crown, User, Send } from 'lucide-react'
import SolapiConnectPanel from '@/components/settings/SolapiConnectPanel'

interface Props {
  params: Promise<{ workspaceId: string }>
}

const roleLabels: Record<string, string> = {
  owner: '오너',
  admin: '관리자',
  member: '멤버',
}

export default async function WorkspaceSettingsPage({ params }: Props) {
  const { workspaceId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 워크스페이스 조회 (멤버 확인 포함)
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single()

  if (!workspace) notFound()

  // Solapi 연동 정보 조회
  const { data: solapiIntegration } = await supabase
    .from('workspace_integrations')
    .select('config')
    .eq('workspace_id', workspaceId)
    .eq('provider', 'solapi')
    .single()

  // 멤버 목록 조회
  const { data: members } = await supabase
    .from('workspace_members')
    .select('*, profiles(*)')
    .eq('workspace_id', workspaceId)
    .order('joined_at', { ascending: true })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">워크스페이스 설정</h2>
        <p className="mt-1 text-[14px] text-gray-500">
          {workspace.name}의 설정을 관리합니다.
        </p>
      </div>

      {/* 기본 정보 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-4">기본 정보</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="text-[13px] text-gray-500">이름</span>
            <span className="text-[13px] font-medium text-gray-900">{workspace.name}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="text-[13px] text-gray-500">슬러그</span>
            <code className="text-[12px] font-mono text-gray-700 bg-gray-50 px-2 py-0.5 rounded-lg">{workspace.slug}</code>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-[13px] text-gray-500">플랜</span>
            <Badge variant="secondary" className="text-[11px] font-semibold">
              {workspace.plan === 'free' ? '무료' : workspace.plan}
            </Badge>
          </div>
        </div>
      </div>

      {/* 멤버 목록 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-semibold text-gray-900">
            멤버 ({members?.length ?? 0}명)
          </h3>
        </div>
        <div className="space-y-2">
          {members?.map((member) => {
            const profile = Array.isArray(member.profiles)
              ? member.profiles[0]
              : member.profiles
            return (
              <div
                key={member.id}
                className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {profile?.full_name?.[0]?.toUpperCase() ?? profile?.email?.[0]?.toUpperCase() ?? 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-900 truncate">
                    {profile?.full_name ?? '이름 없음'}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {profile?.email}
                  </p>
                </div>
                <Badge
                  variant={member.role === 'owner' ? 'default' : 'secondary'}
                  className="text-[11px] font-semibold"
                >
                  {roleLabels[member.role] ?? member.role}
                </Badge>
              </div>
            )
          })}
        </div>
      </div>
      {/* 발송 설정 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-1">
          <Send className="w-4 h-4 text-primary" />
          <h3 className="text-[14px] font-semibold text-gray-900">발송 설정</h3>
        </div>
        <p className="text-[12px] text-gray-400 mb-4">
          충전, 발신번호 등록, 카카오 채널 연동을 설정합니다.
        </p>
        <SolapiConnectPanel workspaceId={workspaceId} />
      </div>
    </div>
  )
}
