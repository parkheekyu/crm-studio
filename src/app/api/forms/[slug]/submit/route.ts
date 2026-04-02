import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enrollLeadInScenarios } from '@/lib/scenarios/enroll'

interface FormField {
  key: string
  label: string
  type: string
  required: boolean
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const body = await request.json()
  const supabase = createAdminClient()

  // 폼 조회
  const { data: form, error: formError } = await supabase
    .from('landing_forms')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (formError || !form) {
    return NextResponse.json(
      { error: '폼을 찾을 수 없거나 비활성 상태입니다.' },
      { status: 404 }
    )
  }

  const fields = (form.fields as unknown as FormField[]) ?? []

  // 필수 필드 검증
  for (const field of fields) {
    if (field.required && !String(body[field.key] ?? '').trim()) {
      return NextResponse.json(
        { error: `${field.label}을(를) 입력해 주세요.` },
        { status: 400 }
      )
    }
  }

  const name = String(body.name ?? '').trim()
  const phone = String(body.phone ?? '').trim()
  const email = String(body.email ?? '').trim() || null

  // 리드 등록
  const { data: lead, error: insertError } = await supabase.from('leads').insert({
    workspace_id: form.workspace_id,
    name,
    phone,
    email,
    source: form.title,
  }).select('id').single()

  if (insertError) {
    return NextResponse.json(
      { error: '등록에 실패했습니다. 다시 시도해 주세요.' },
      { status: 500 }
    )
  }

  // 그룹 자동 배정 (lead_source의 group_id 참조)
  if (lead && form.lead_source_id) {
    const { data: leadSource } = await supabase
      .from('lead_sources')
      .select('group_id')
      .eq('id', form.lead_source_id)
      .single()

    if (leadSource?.group_id) {
      try {
        await supabase.from('lead_group_memberships').insert({
          lead_id: lead.id,
          group_id: leadSource.group_id,
        })

        // 그룹 시나리오 등록
        const { data: groupScenarios } = await supabase
          .from('scenarios')
          .select('id')
          .eq('workspace_id', form.workspace_id)
          .eq('trigger_type', 'group_join')
          .eq('trigger_value', leadSource.group_id)
          .eq('is_active', true)

        if (groupScenarios?.length) {
          await supabase.from('scenario_enrollments').insert(
            groupScenarios.map((s) => ({
              scenario_id: s.id,
              lead_id: lead.id,
              workspace_id: form.workspace_id,
              current_step: 0,
            }))
          )
        }
      } catch {
        // 그룹 배정 실패해도 리드는 생성됨
      }
    }
  }

  // 시나리오 자동 등록
  if (lead) {
    await enrollLeadInScenarios(lead.id, form.workspace_id, form.title).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
