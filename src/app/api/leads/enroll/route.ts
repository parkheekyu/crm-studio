import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enrollLeadsInScenarios } from '@/lib/scenarios/enroll'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const { lead_ids, workspace_id } = await request.json()

  if (!workspace_id || !lead_ids?.length) {
    return NextResponse.json({ error: '필수 파라미터가 누락되었습니다.' }, { status: 400 })
  }

  // 워크스페이스 멤버 확인
  const { data: member } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspace_id)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
  }

  // 리드 source 조회
  const { data: leads } = await supabase
    .from('leads')
    .select('id, source')
    .in('id', lead_ids)
    .eq('workspace_id', workspace_id)

  const leadSources: Record<string, string | null> = {}
  for (const lead of leads ?? []) {
    leadSources[lead.id] = lead.source
  }

  await enrollLeadsInScenarios(lead_ids, workspace_id, leadSources)

  return NextResponse.json({ success: true })
}
