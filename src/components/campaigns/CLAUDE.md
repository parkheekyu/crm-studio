# components/campaigns/ — CRM 발송 컴포넌트

## 컴포넌트 목록
| 파일 | 역할 |
|------|------|
| `CampaignList.tsx` | 캠페인 테이블 (상태, 건수, 유형) |
| `CampaignStatusBadge.tsx` | 상태별 컬러 배지 (draft/sending/completed/failed) |
| `TemplateEditor.tsx` | 메시지 편집기 (변수 삽입 버튼 + 바이트 카운터) |
| `LeadSelector.tsx` | 수신자 선택 (전체/필터/수동 체크박스) |
| `MessagePreview.tsx` | 변수 치환 미리보기 (폰 UI) |
| `SendConfirmDialog.tsx` | 발송 전 확인 다이얼로그 |
| `MessageLogTable.tsx` | 수신자별 발송 결과 테이블 |

## 변수 삽입
- `TemplateEditor` 내 버튼 클릭 → 커서 위치에 `#{이름}` 등 삽입
- `getByteLength()` → SMS(90B) / LMS(2000B) 자동 감지

## 타입
- `Campaign`, `MessageLog` from `@/types`
- `TargetFilter` from `LeadSelector.tsx`
