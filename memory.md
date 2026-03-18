# 클로드 개인 학습 노트

## 빌드 & 개발 명령
- 개발 서버: `npm run dev` (포트 3000)
- 타입 체크: `npx tsc --noEmit`
- 빌드: `npm run build`
- Supabase 타입 생성: `npx supabase gen types typescript --project-id [PROJECT_ID] > src/types/database.types.ts`
- shadcn 컴포넌트 추가: `npx shadcn@latest add [component-name]`

## 중요 패턴
- Supabase 서버 클라이언트는 항상 async/await로 생성 (Next.js 15는 `cookies()`가 Promise 반환)
- `middleware.ts`에서 반드시 `getUser()` 호출 → 세션 토큰 자동 갱신
- `getSession()`은 보안상 사용 금지 (JWT 토큰 검증 안 함)
- OAuth 콜백: `/auth/callback/route.ts`에서 `exchangeCodeForSession` 처리
- 신규 유저 (워크스페이스 없음): `/dashboard` 진입 시 `/workspace/new`로 리다이렉트

## 환경변수 위치
- 로컬: `.env.local` (gitignore에 포함)
- 카카오/구글 OAuth 키: Supabase Dashboard > Authentication > Providers에서만 설정
- Vercel 배포 시: Project Settings > Environment Variables에 동일하게 등록

## 디버깅 인사이트
- (작업하며 추가 예정)
