import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enrollLeadsInGroupScenarios } from '@/lib/scenarios/enroll'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { lead_ids, workspace_id, group_id } = await request.json()

  if (!lead_ids?.length || !workspace_id || !group_id) {
    return NextResponse.json(
      { error: 'lead_ids, workspace_id, group_id required' },
      { status: 400 }
    )
  }

  // 워크스페이스 멤버 확인
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspace_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await enrollLeadsInGroupScenarios(lead_ids, workspace_id, group_id)

  return NextResponse.json({ success: true })
}
