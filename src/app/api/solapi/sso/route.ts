import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSSOAccount } from '@/lib/solapi-central'

/**
 * POST /api/solapi/sso
 * 워크스페이스의 Solapi 서브계정 생성 (또는 기존 계정 조회)
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
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
