/**
 * Solapi 마이사이트 SSO 기반 연동
 *
 * 구조:
 * - 우리 워크스페이스 1개 = Solapi 서브계정 1개
 * - SSO로 자동 생성, 사용자는 Solapi를 모름
 * - 충전/발신번호/채널 연동 → Solapi 마이사이트 페이지로 이동 (SSO 자동 로그인)
 * - 발송 → 사용자 본인 Solapi 계정으로
 */
import crypto from 'crypto'

const API_KEY = process.env.SOLAPI_API_KEY!
const API_SECRET = process.env.SOLAPI_API_SECRET!
const APP_ID = process.env.SOLAPI_APP_ID!
const BASE_URL = 'https://api.solapi.com'

/** HMAC-SHA256 인증 헤더 */
function buildAuthHeaders() {
  const date = new Date().toISOString()
  const salt = crypto.randomBytes(32).toString('hex')
  const signature = crypto
    .createHmac('sha256', API_SECRET)
    .update(date + salt)
    .digest('hex')
  return {
    Authorization: `HMAC-SHA256 ApiKey=${API_KEY}, Date=${date}, salt=${salt}, Signature=${signature}`,
    'Content-Type': 'application/json',
  }
}

// ─── SSO ───

/**
 * SSO 토큰 생성 — 워크스페이스에 대한 Solapi 서브계정 자동 생성/로그인
 * 이미 생성된 경우 기존 토큰 반환
 */
export async function createSSOAccount(workspaceId: string, email: string) {
  // 먼저 기존 토큰 조회
  const existing = await getSSOToken(workspaceId)
  if (existing?.ssoToken) return existing

  // 없으면 새로 생성
  const headers = buildAuthHeaders()
  const password = crypto.createHash('sha256').update(`${workspaceId}_${API_SECRET}`).digest('hex').slice(0, 20)

  const res = await fetch(`${BASE_URL}/appstore/v2/sso/connect`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      appId: APP_ID,
      email,
      password,
      customerKey: workspaceId,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.errorMessage ?? 'Solapi 계정 생성에 실패했습니다.')
  }

  const data = await res.json()

  // 생성 후 다시 조회하여 accountId 등 확보
  const token = await getSSOToken(workspaceId)
  return token ?? data
}

/** customerKey(workspaceId)로 기존 SSO 정보 조회 */
export async function getSSOToken(workspaceId: string) {
  const headers = buildAuthHeaders()
  const res = await fetch(
    `${BASE_URL}/appstore/v2/sso/apps/${APP_ID}/customer-keys/${workspaceId}`,
    { headers }
  )
  if (!res.ok) return null
  return res.json() as Promise<{
    customerKey: string
    accountId: string
    memberId: string
    ssoToken: string
  }>
}

/**
 * Solapi 마이사이트 자동 로그인 URL 생성
 * 사용자가 이 URL로 이동하면 Solapi에 자동 로그인되어 해당 페이지로 감
 */
export function buildSolapiPageUrl(ssoToken: string, page: keyof typeof SOLAPI_PAGES) {
  const path = SOLAPI_PAGES[page]
  const redirectUri = encodeURIComponent(`https://solapi.com${path}`)
  return `${BASE_URL}/appstore/v2/sso/connect-homepage?ssoCode=${ssoToken}&redirectUri=${redirectUri}`
}

/** Solapi 콘솔 주요 페이지 */
export const SOLAPI_PAGES = {
  충전: '/dashboard',
  발신번호: '/senderids',
  카카오채널: '/kakao/channel',
  알림톡템플릿: '/kakao/template',
  대시보드: '/dashboard',
} as const

// ─── 사용자 Solapi 계정 정보 조회 ───

/** 사용자의 잔액 조회 */
export async function getUserBalance(ssoAccountId: string) {
  // TODO: 사용자 계정의 잔액을 조회하는 방법 확인 필요
  // 현재는 우리 계정 잔액만 조회 가능
  const headers = buildAuthHeaders()
  const res = await fetch(`${BASE_URL}/cash/v1/balance`, { headers })
  if (!res.ok) return 0
  const data = await res.json()
  return data.balance ?? 0
}
