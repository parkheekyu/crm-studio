import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSSOAccount } from '@/lib/solapi-central'

/**
 * POST /api/solapi/sso
 * 워크스페이스의 Solapi SSO 계정 생성 (또는 기존 계정 조회)
 * 성공 시 workspace_integrations에 sso 정보 저장
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspaceId } = await request.json()
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const result = await createSSOAccount(workspaceId, user.email ?? `${workspaceId}@crm.studio`)
    if (!result?.ssoToken) throw new Error('SSO 계정 생성에 실패했습니다.')

    // workspace_integrations에 SSO 연동 정보 저장
    await supabase.from('workspace_integrations').upsert({
      workspace_id: workspaceId,
      provider: 'solapi_sso',
      config: {
        customer_key: result.customerKey,
        account_id: result.accountId,
        member_id: result.memberId,
        sso_token: result.ssoToken,
        connected_at: new Date().toISOString(),
        email: user.email,
      } as any,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id,provider' })

    return NextResponse.json({ success: true, accountId: result.accountId })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
