# app/(dashboard)/forms/ — 랜딩 폼 관리 라우트

## 파일 구조
| 파일 | 역할 |
|------|------|
| `page.tsx` | 서버 컴포넌트 — 폼 목록 fetch |
| `FormsClient.tsx` | 클라이언트 — 목록 UI + 생성 버튼 |
| `new/page.tsx` | 서버 컴포넌트 — 폼 생성 페이지 |
| `new/FormCreateClient.tsx` | 클라이언트 — 폼 빌더 (제목, 슬러그, 설명, 필드 설정) |

## 공개 폼 라우트
- `/f/[slug]` — 인증 불필요, 비로그인 접근 가능
- `POST /api/forms/[slug]/submit` — admin client로 leads INSERT (RLS 우회)

## slug 생성
- 제목 기반 자동 생성 + 4자리 랜덤 접미사
- 유일성: DB unique constraint로 보장
