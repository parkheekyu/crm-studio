import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSSOAccount, getSSOCode, buildSolapiPageUrl, SOLAPI_PAGES } from '@/lib/solapi-central'

/**
 * POST /api/solapi/page-url
 * 3단계 SSO 플로우:
 * 1. createSSOAccount → ssoToken (영구)
 * 2. getSSOCode(ssoToken) → ssoCode (일회성)
 * 3. buildSolapiPageUrl(ssoCode, page) → 자동 로그인 URL
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
    // 1단계: SSO 계정 생성 or 기존 계정 조회 → ssoToken
    const sso = await createSSOAccount(workspaceId, user.email ?? `${workspaceId}@crm.studio`)
    console.log('[page-url] sso result:', JSON.stringify(sso))
    if (!sso?.ssoToken) throw new Error(`SSO 토큰 없음. sso=${JSON.stringify(sso)}`)

    // 2단계: ssoToken → 일회성 ssoCode
    const ssoCode = await getSSOCode(sso.ssoToken)
    console.log('[page-url] ssoCode:', ssoCode)
    if (!ssoCode) throw new Error('SSO 코드 발급 실패 (위 getSSOCode 로그 확인)')

    // 3단계: 마이사이트 자동 로그인 URL 생성
    const url = buildSolapiPageUrl(ssoCode, page as keyof typeof SOLAPI_PAGES)
    return NextResponse.json({ url })
  } catch (e: any) {
    console.error('[page-url] error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
