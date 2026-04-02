import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSSOAccount, buildSolapiPageUrl, SOLAPI_PAGES } from '@/lib/solapi-central'

/**
 * POST /api/solapi/page-url
 * Solapi 마이사이트 특정 페이지 자동 로그인 URL 생성
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspaceId, page } = await request.json()
  if (!workspaceId || !page) {
    return NextResponse.json({ error: 'workspaceId and page required' }, { status: 400 })
  }

  if (!(page in SOLAPI_PAGES)) {
    return NextResponse.json({ error: 'Invalid page' }, { status: 400 })
  }

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const sso = await createSSOAccount(workspaceId, user.email ?? `${workspaceId}@crm.studio`)
    if (!sso?.ssoToken) throw new Error('SSO 토큰을 가져올 수 없습니다.')

    const url = buildSolapiPageUrl(sso.ssoToken, page as keyof typeof SOLAPI_PAGES)
    return NextResponse.json({ url })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
