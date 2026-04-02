import { NextRequest, NextResponse } from 'next/server'
import { processScenarioEnrollments } from '@/lib/scenarios/execute'

export async function GET(request: NextRequest) {
  // Vercel Cron 인증 확인
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await processScenarioEnrollments()
    return NextResponse.json({ success: true, ...result })
  } catch (err: any) {
    console.error('Scenario cron error:', err)
    return NextResponse.json(
      { error: err.message ?? 'Internal error' },
      { status: 500 }
    )
  }
}
