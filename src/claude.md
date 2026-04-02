# src/ — 프론트엔드 컨텍스트

## 라우팅 구조
```
app/
├── (auth)/         # 공개 — 로그인, OAuth 콜백
│   └── login/
├── (dashboard)/    # 인증 필요 — middleware.ts가 보호
│   ├── dashboard/
│   ├── workspace/
│   └── settings/
└── auth/callback/  # OAuth code exchange Route Handler
```

## 아키텍처 원칙
- **멀티테넌시:** Phase 2부터 모든 비즈니스 데이터에 `workspace_id` FK 필수
- **Supabase 클라이언트 3종 분리:**
  - 클라이언트 컴포넌트: `lib/supabase/client.ts`
  - 서버 컴포넌트 / Server Action: `lib/supabase/server.ts` (async 함수)
  - 미들웨어: `middleware.ts` 내 인라인
- **Server Component 기본:** 데이터 패칭은 서버에서, 인터랙션만 `'use client'`

## 코드 컨벤션
- 컴포넌트: PascalCase, `components/` 하위 도메인별 폴더
- Server Actions: 파일 최상단 `'use server'` 선언
- 환경변수: `NEXT_PUBLIC_` prefix → 클라이언트 노출, 그 외 서버 전용
- 타입:
  - `types/database.types.ts` — Supabase CLI 자동생성 (`npm run db:types`), 직접 편집 금지
  - `types/index.ts` — 편의 타입 (`Profile`, `Workspace`, `WorkspaceMember`) 재export, 컴포넌트에서 `@/types`로 import
- 경로 alias: `@/*` → `src/*`

## 참조 문서
- 컴포넌트 & 디자인 시스템: `components/claude.md`
- Supabase SSR 패턴: `lib/supabase/GUIDE.md`
