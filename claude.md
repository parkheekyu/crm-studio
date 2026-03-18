# CRM SaaS - 팀 컨텍스트

## 서비스 개요
DB카트 유사의 올인원 CRM SaaS. 리드 수집 + Solapi 기반 메시지 시나리오 발송.

## 기술 스택
- Next.js 15 App Router + TypeScript
- Supabase (DB + Auth) — `@supabase/ssr` 패키지 사용
- Tailwind CSS v4 + shadcn/ui (New York 스타일)
- npm, Vercel 배포

## 아키텍처 원칙
- **멀티테넌시:** 모든 비즈니스 데이터에 `workspace_id` FK 필수
- **RLS 필수:** 모든 Supabase 테이블에 Row Level Security 활성화
- **라우트 그룹:** `(auth)` 공개, `(dashboard)` 인증 필요
- **Supabase 클라이언트 3종 분리:**
  - 브라우저: `src/lib/supabase/client.ts`
  - 서버: `src/lib/supabase/server.ts`
  - 미들웨어: `middleware.ts` 내 인라인

## 코드 컨벤션
- 컴포넌트: PascalCase, `src/components/` 하위 도메인별 폴더
- Server Actions: 파일 상단 `'use server'`
- 환경변수: `NEXT_PUBLIC_` prefix는 클라이언트 노출용만
- 타입: `src/types/database.types.ts` (Supabase CLI 자동생성)
- 경로 alias: `@/*` → `src/*`

## 디자인 시스템 (Toss Ads 컨셉)
- Primary: `#3182f6` (blue-500)
- 카드: `bg-white border border-gray-100 rounded-2xl shadow-sm`
- 버튼: `bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl`
- 간격: 24px/32px 기반 일관된 padding
- 폰트: Pretendard (웹폰트 적용)

## Phase 로드맵
- **Phase 1:** 인증 + 워크스페이스 + 대시보드 레이아웃 ✅
- **Phase 2:** 리드 수집 (랜딩 빌더, 폼, CSV 업로드)
- **Phase 3:** CRM 시나리오 빌더 + Solapi 발송
- **Phase 4:** 분석 대시보드, 발송 로그

## 참조 문서 (레이지 로딩)
- Supabase SSR 패턴: `src/lib/supabase/GUIDE.md`
- DB 스키마 전체: `supabase/schema.sql` (Phase 2부터 추가)
