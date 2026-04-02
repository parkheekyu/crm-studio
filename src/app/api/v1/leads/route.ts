import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateApiKey } from '@/lib/api-keys'
import { enrollLeadInScenarios } from '@/lib/scenarios/enroll'

export async function POST(request: NextRequest) {
  // API 키 인증
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid Authorization header' },
      { status: 401 }
    )
  }

  const apiKey = auth.slice(7)
  const workspaceId = await validateApiKey(apiKey)

  if (!workspaceId) {
    return NextResponse.json(
      { error: 'Invalid or inactive API key' },
      { status: 401 }
    )
  }

  // 바디 파싱
  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
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
  const source = body.source ? String(body.source).trim() : 'API'
  const notes = body.notes ? String(body.notes).trim() : null

  // 리드 등록
  const supabase = createAdminClient()
  const { data: lead, error: insertError } = await supabase
    .from('leads')
    .insert({
      workspace_id: workspaceId,
      name,
      phone,
      email,
      source,
      notes,
    })
    .select('id')
    .single()

  if (insertError) {
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }

  // 시나리오 자동 등록
  if (lead) {
    await enrollLeadInScenarios(lead.id, workspaceId, source).catch(() => {})
  }

  return NextResponse.json({ success: true, lead_id: lead?.id })
}
