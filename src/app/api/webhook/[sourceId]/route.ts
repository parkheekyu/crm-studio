import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enrollLeadInScenarios } from '@/lib/scenarios/enroll'

/**
 * 외부 웹훅으로 리드 수신
 * POST /api/webhook/[sourceId]
 * Body: { name, phone, email?, source? }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const { sourceId } = await params
  const supabase = createAdminClient()

  // lead_source 확인
  const { data: source } = await supabase
    .from('lead_sources')
    .select('id, workspace_id, title, type, is_active, group_id')
    .eq('id', sourceId)
    .single()

  if (!source) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
  }

  if (!source.is_active) {
    return NextResponse.json({ error: 'Webhook is inactive' }, { status: 403 })
  }

  if (source.type !== 'webhook') {
    return NextResponse.json({ error: 'Not a webhook source' }, { status: 400 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const name = String(body.name ?? '').trim()
  const phone = String(body.phone ?? '').trim()

  if (!name || !phone) {
    return NextResponse.json(
      { error: 'name and phone are required' },
      { status: 400 }
    )
  }

  const email = body.email ? String(body.email).trim() : null
  const leadSource = body.source ? String(body.source).trim() : source.title

  // 리드 생성
  const { data: lead, error: insertError } = await supabase
    .from('leads')
    .insert({
      workspace_id: source.workspace_id,
      name,
      phone,
      email,
      source: leadSource,
    })
    .select('id')
    .single()

  if (insertError || !lead) {
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }

  // 그룹 자동 배정
  if (source.group_id) {
    try {
      await supabase.from('lead_group_memberships').insert({
        lead_id: lead.id,
        group_id: source.group_id,
      })
    } catch {
      // 그룹 배정 실패해도 리드는 생성됨
    }
  }

  // 시나리오 자동 등록
  try {
    await enrollLeadInScenarios(lead.id, source.workspace_id, leadSource)
    // 그룹 시나리오도 등록
    if (source.group_id) {
      const { data: groupScenarios } = await supabase
        .from('scenarios')
        .select('id')
        .eq('workspace_id', source.workspace_id)
        .eq('trigger_type', 'group_join')
        .eq('trigger_value', source.group_id)
        .eq('is_active', true)

      if (groupScenarios?.length) {
        await supabase.from('scenario_enrollments').insert(
          groupScenarios.map((s) => ({
            scenario_id: s.id,
            lead_id: lead.id,
            workspace_id: source.workspace_id,
            current_step: 0,
          }))
        )
      }
    }
  } catch {
    // 등록 실패해도 리드는 생성됨
  }

  return NextResponse.json({ success: true, lead_id: lead.id })
}
