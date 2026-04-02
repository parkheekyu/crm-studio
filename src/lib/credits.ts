/**
 * 크레딧 관리 — 잔액 조회, 충전, 차감
 */
import { createAdminClient } from '@/lib/supabase/admin'

/** 메시지 타입별 단가 (원) */
const PRICING: Record<string, number> = {
  SMS: 18,
  LMS: 45,
  MMS: 110,
  ATA: 13,
  FT: 15,
  EMAIL: 0,
}

export function getUnitPrice(messageType: string): number {
  return PRICING[messageType] ?? 18
}

/** 잔액 조회 */
export async function getBalance(workspaceId: string): Promise<number> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('workspace_credits')
    .select('balance')
    .eq('workspace_id', workspaceId)
    .single()

  if (!data) {
    // 레코드가 없으면 생성
    await supabase.from('workspace_credits').insert({ workspace_id: workspaceId, balance: 0 })
    return 0
  }

  return data.balance
}

/** 발송 전 잔액 확인 — 부족하면 에러 throw */
export async function checkBalance(workspaceId: string, messageType: string, count: number) {
  const unitPrice = getUnitPrice(messageType)
  const totalCost = unitPrice * count
  const balance = await getBalance(workspaceId)

  if (balance < totalCost) {
    throw new Error(
      `크레딧이 부족합니다. 필요: ${totalCost.toLocaleString()}원, 잔액: ${balance.toLocaleString()}원`
    )
  }

  return { unitPrice, totalCost, balance }
}

/** 크레딧 차감 (발송 후) */
export async function deductCredits(
  workspaceId: string,
  amount: number,
  description: string,
  campaignId?: string
) {
  const supabase = createAdminClient()

  // 잔액 차감 (atomic)
  const { data: credit } = await supabase
    .from('workspace_credits')
    .select('balance')
    .eq('workspace_id', workspaceId)
    .single()

  if (!credit) throw new Error('크레딧 정보를 찾을 수 없습니다.')

  const newBalance = credit.balance - amount

  await supabase
    .from('workspace_credits')
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq('workspace_id', workspaceId)

  // 거래 내역 기록
  await supabase.from('credit_transactions').insert({
    workspace_id: workspaceId,
    type: 'deduct',
    amount: -amount,
    balance_after: newBalance,
    description,
    campaign_id: campaignId ?? null,
  })

  return newBalance
}

/** 크레딧 충전 */
export async function chargeCredits(
  workspaceId: string,
  amount: number,
  type: 'charge' | 'auto_charge' = 'charge'
) {
  const supabase = createAdminClient()

  const { data: credit } = await supabase
    .from('workspace_credits')
    .select('balance')
    .eq('workspace_id', workspaceId)
    .single()

  const currentBalance = credit?.balance ?? 0
  const newBalance = currentBalance + amount

  await supabase
    .from('workspace_credits')
    .upsert({
      workspace_id: workspaceId,
      balance: newBalance,
      updated_at: new Date().toISOString(),
    })

  await supabase.from('credit_transactions').insert({
    workspace_id: workspaceId,
    type,
    amount,
    balance_after: newBalance,
    description: type === 'auto_charge' ? `자동충전 ${amount.toLocaleString()}원` : `크레딧 충전 ${amount.toLocaleString()}원`,
  })

  return newBalance
}
