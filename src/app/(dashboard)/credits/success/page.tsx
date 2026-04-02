import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SuccessClient from './SuccessClient'

interface Props {
  searchParams: Promise<{
    paymentKey?: string
    orderId?: string
    amount?: string
    workspaceId?: string
  }>
}

export default async function SuccessPage({ searchParams }: Props) {
  const params = await searchParams
  const { paymentKey, orderId, amount, workspaceId } = params

  if (!paymentKey || !orderId || !amount || !workspaceId) {
    redirect('/credits/fail?message=잘못된+요청입니다')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 결제 승인 요청
  let confirmResult: any = null
  let error: string | null = null

  try {
    const secretKey = process.env.TOSS_SECRET_KEY!
    const encoded = Buffer.from(`${secretKey}:`).toString('base64')

    const res = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encoded}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: Number(amount),
      }),
    })

    confirmResult = await res.json()

    if (!res.ok) {
      error = confirmResult.message ?? '결제 승인에 실패했습니다.'
    }
  } catch {
    error = '결제 승인 중 오류가 발생했습니다.'
  }

  // 결제 성공 → 크레딧 충전
  if (!error && confirmResult) {
    const { chargeCredits } = await import('@/lib/credits')
    await chargeCredits(workspaceId, Number(amount))
  }

  return <SuccessClient error={error} amount={Number(amount)} workspaceId={workspaceId} />
}
