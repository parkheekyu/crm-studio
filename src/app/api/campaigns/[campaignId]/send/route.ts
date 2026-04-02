import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { executeCampaignSend } from '@/lib/campaigns/send'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params

  // 인증 확인
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  try {
    const result = await executeCampaignSend(campaignId)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? '발송 중 오류가 발생했습니다.' },
      { status: 400 }
    )
  }
}
