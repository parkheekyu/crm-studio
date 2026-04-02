# app/(dashboard)/campaigns/ — CRM 발송 라우트

## 파일 구조
| 파일 | 역할 |
|------|------|
| `page.tsx` | 서버 — 캠페인 목록 fetch |
| `CampaignsClient.tsx` | 클라이언트 — 목록 UI |
| `new/page.tsx` | 서버 — 리드 + 연동 정보 fetch |
| `new/CampaignCreateClient.tsx` | 클라이언트 — 3단계 위저드 (메시지→수신자→미리보기) |
| `[campaignId]/page.tsx` | 서버 — 캠페인 + 로그 fetch |
| `[campaignId]/CampaignDetailClient.tsx` | 클라이언트 — 캠페인 정보 + 발송 로그 |

## 발송 흐름
1. `/campaigns/new` — 캠페인 생성 (message_content + target_filter)
2. POST `/api/campaigns/[id]/send` — Solapi SDK로 발송
3. `/campaigns/[id]` — 발송 결과 + 로그 확인

## 변수 시스템
`#{이름}`, `#{전화번호}`, `#{이메일}` → Solapi replacements로 자동 변환
