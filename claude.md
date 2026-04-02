# CRM Studio — 루트 컨텍스트

## 서비스 개요
DB카트 유사의 올인원 CRM SaaS. 리드 수집 + Solapi 기반 메시지 시나리오 발송.

## 기술 스택
Next.js 15 App Router · Supabase (DB + Auth) · Tailwind CSS v4 + shadcn/ui · npm · Vercel

## Phase 로드맵
- **Phase 1:** 인증 + 워크스페이스 + 대시보드 레이아웃 ✅
- **Phase 2:** 리드 수집 (랜딩 빌더, 폼, CSV 업로드)
- **Phase 3:** CRM 시나리오 빌더 + Solapi 발송
- **Phase 4:** 발송 로그 + 성과 분석 대시보드

## 참조 문서 (레이지 로딩 — 필요할 때만 열기)
- 프론트엔드 컨벤션 & 라우팅: `src/claude.md`
- 컴포넌트 & 디자인 시스템: `src/components/claude.md`
- Supabase 스키마 & RLS 패턴: `supabase/claude.md`
- Supabase SSR 코드 패턴: `src/lib/supabase/GUIDE.md`
