import { NextRequest, NextResponse } from 'next/server'
import { testConnection } from '@/lib/solapi'

export async function POST(request: NextRequest) {
  const { api_key, api_secret } = await request.json()

  if (!api_key || !api_secret) {
    return NextResponse.json(
      { error: 'API Key와 Secret을 입력해 주세요.' },
      { status: 400 }
    )
  }

  try {
    const balance = await testConnection(api_key, api_secret)
    return NextResponse.json({ success: true, balance })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'API 키가 올바르지 않거나 연결할 수 없습니다.' },
      { status: 400 }
    )
  }
}
