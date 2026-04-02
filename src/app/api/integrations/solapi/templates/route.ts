import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SolapiMessageService } from 'solapi'

/**
 * Solapi 알림톡 템플릿 + 카카오 채널 목록 조회
 * TODO: SSO 사용자 계정으로 조회하도록 전환 필요
 * 현재는 우리 중앙 계정에서 조회
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspace_id')
  if (!workspaceId) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const client = new SolapiMessageService(
      process.env.SOLAPI_API_KEY!,
      process.env.SOLAPI_API_SECRET!
    )

    // 템플릿
    let templates: any[] = []
    try {
      const result = await client.getKakaoAlimtalkTemplates()
      templates = (result?.templateList ?? []).map((t: any) => ({
        templateId: t.templateId,
        name: t.name,
        content: t.content ?? '',
        status: t.status,
        pfId: t.pfId ?? null,
        buttons: t.buttons ?? [],
      }))
    } catch {}

    // 채널 (DB)
    const { data: dbChannels } = await supabase
      .from('workspace_kakao_channels')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)

    const channels = (dbChannels ?? []).map((ch) => ({
      pfId: ch.pf_id,
      searchId: ch.search_id,
      channelName: ch.channel_name,
    }))

    return NextResponse.json({ templates, channels })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
