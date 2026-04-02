# components/leads/ — 리드 관리 컴포넌트

## 컴포넌트 목록
| 파일 | 역할 |
|------|------|
| `LeadCreateForm.tsx` | 리드 추가 폼 (클라이언트) |
| `LeadCreateModal.tsx` | Dialog 래퍼, LeadCreateForm 포함 |
| `LeadList.tsx` | 리드 테이블 + 검색 (클라이언트) |

## 데이터 흐름
- `leads/page.tsx` (서버) → 리드 목록 fetch → `LeadsClient.tsx` (클라이언트) props 전달
- 리드 추가: `LeadCreateModal` → `LeadCreateForm` → `supabase.from('leads').insert()` → `router.refresh()`

## 폼 필드
- 이름 (필수), 전화번호 (필수), 이메일 (선택), 유입 경로 Select (선택)
- 유입 경로 선택지: 직접입력, 랜딩 폼, CSV 업로드, 페이스북, 기타

## 타입
- `Lead` from `@/types` → `Tables<'leads'>` from database.types
