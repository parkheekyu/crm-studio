# components/forms/ — 랜딩 폼 컴포넌트

## 컴포넌트 목록
| 파일 | 역할 |
|------|------|
| `FormCard.tsx` | 폼 카드 (목록에서 사용, 활성/비활성 토글, URL 복사) |

## 데이터 흐름
- `forms/page.tsx` (서버) → 폼 목록 fetch → `FormsClient.tsx` (클라이언트)
- `FormCard` → Switch 토글 → `supabase.from('landing_forms').update()` → `router.refresh()`

## 타입
- `LandingForm` from `@/types` → `Tables<'landing_forms'>` from database.types
- `fields` JSONB: `[{ key, label, type, required }]`
