import { SolapiMessageService } from 'solapi'
import type { Lead } from '@/types'
import { buildReplacements } from './campaigns/variables'

export function createSolapiClient(apiKey: string, apiSecret: string) {
  return new SolapiMessageService(apiKey, apiSecret)
}

interface SendSmsOptions {
  leads: Lead[]
  template: string
  senderPhone: string
}

/**
 * SMS/LMS 메시지 배열 생성 (Solapi send용)
 */
export function buildSmsMessages({ leads, template, senderPhone }: SendSmsOptions) {
  const replacements = buildReplacements(leads, template)

  return {
    messages: leads.map((lead) => ({
      to: lead.phone.replace(/[^0-9]/g, ''),
      from: senderPhone.replace(/[^0-9]/g, ''),
      text: template,
    })),
    replacements,
  }
}

interface SendAlimTalkOptions {
  leads: Lead[]
  template: string
  senderPhone: string
  pfId: string
  templateId: string
}

/**
 * 알림톡 메시지 배열 생성
 */
export function buildAlimTalkMessages({
  leads,
  template,
  senderPhone,
  pfId,
  templateId,
}: SendAlimTalkOptions) {
  const replacements = buildReplacements(leads, template)

  return {
    messages: leads.map((lead) => ({
      to: lead.phone.replace(/[^0-9]/g, ''),
      from: senderPhone.replace(/[^0-9]/g, ''),
      text: template,
      kakaoOptions: {
        pfId,
        templateId,
      },
    })),
    replacements,
  }
}

interface SendFriendTalkOptions {
  leads: Lead[]
  template: string
  senderPhone: string
  pfId: string
  imageId?: string
  adFlag?: boolean
  buttons?: { buttonType: string; buttonName: string; linkMo?: string; linkPc?: string }[]
}

/**
 * 친구톡 메시지 배열 생성
 * Solapi API: kakaoOptions.messageType = 'FT' (텍스트) / 'FI' (이미지)
 * 메시지 내용은 kakaoOptions.content에 넣어야 함 (text 아님)
 */
export function buildFriendTalkMessages({
  leads,
  template,
  senderPhone,
  pfId,
  imageId,
  adFlag = false,
  buttons,
}: SendFriendTalkOptions) {
  const replacements = buildReplacements(leads, template)

  // 광고 메시지일 경우 (광고) 문구 자동 추가
  let content = template
  if (adFlag) {
    if (!content.startsWith('(광고)')) content = `(광고) ${content}`
  }

  return {
    messages: leads.map((lead) => ({
      to: lead.phone.replace(/[^0-9]/g, ''),
      from: senderPhone.replace(/[^0-9]/g, ''),
      kakaoOptions: {
        pfId,
        messageType: imageId ? 'FI' : 'FT',
        content,
        adFlag,
        ...(imageId ? { imageId } : {}),
        ...(buttons && buttons.length > 0 ? { buttons } : {}),
      },
    })),
    replacements,
  }
}

/**
 * Solapi HMAC-SHA256 인증 헤더 생성
 */
export function buildSolapiAuthHeaders(apiKey: string, apiSecret: string) {
  const crypto = require('crypto')
  const date = new Date().toISOString()
  const salt = crypto.randomBytes(32).toString('hex')
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(date + salt)
    .digest('hex')
  return {
    Authorization: `HMAC-SHA256 ApiKey=${apiKey}, Date=${date}, salt=${salt}, Signature=${signature}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Solapi REST API로 카카오 채널 목록 조회
 * SDK의 getKakaoChannels가 불안정하므로 직접 호출
 */
export async function fetchKakaoChannels(apiKey: string, apiSecret: string) {
  const headers = buildSolapiAuthHeaders(apiKey, apiSecret)
  const res = await fetch('https://api.solapi.com/kakao/v2/channels', { headers })
  if (!res.ok) {
    throw new Error(`채널 조회 실패: ${res.status}`)
  }
  const data = await res.json()
  // 응답이 배열이거나 { channelList: [...] } 형태
  const list = Array.isArray(data) ? data : (data.channelList ?? [])
  return list.map((ch: any) => ({
    pfId: ch.pfId,
    searchId: ch.searchId ?? '',
    channelName: ch.channelName ?? ch.searchId ?? ch.pfId,
    categoryCode: ch.categoryCode ?? null,
  }))
}

/**
 * Solapi REST API로 이미지 업로드 (친구톡 이미지용)
 */
export async function uploadKakaoImage(apiKey: string, apiSecret: string, imageBuffer: Buffer, filename: string) {
  const crypto = require('crypto')
  const date = new Date().toISOString()
  const salt = crypto.randomBytes(32).toString('hex')
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(date + salt)
    .digest('hex')

  const formData = new FormData()
  formData.append('image', new Blob([new Uint8Array(imageBuffer)]), filename)

  const res = await fetch('https://api.solapi.com/kakao/v2/images', {
    method: 'POST',
    headers: {
      Authorization: `HMAC-SHA256 ApiKey=${apiKey}, Date=${date}, salt=${salt}, Signature=${signature}`,
    },
    body: formData,
  })

  if (!res.ok) {
    throw new Error(`이미지 업로드 실패: ${res.status}`)
  }

  return res.json() as Promise<{ imageId: string; imageUrl: string }>
}

/**
 * Solapi 연결 테스트 (잔액 조회)
 */
export async function testConnection(apiKey: string, apiSecret: string) {
  const client = createSolapiClient(apiKey, apiSecret)
  const balance = await client.getBalance()
  return balance
}
