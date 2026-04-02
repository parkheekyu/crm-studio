import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chargeCredits } from '@/lib/credits'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspaceId, amount } = await request.json()
  if (!workspaceId || !amount || amount <= 0) {
    return NextResponse.json({ error: '충전 금액을 확인해 주세요.' }, { status: 400 })
  }

  // 멤버 확인
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const newBalance = await chargeCredits(workspaceId, amount)
  return NextResponse.json({ balance: newBalance })
}
