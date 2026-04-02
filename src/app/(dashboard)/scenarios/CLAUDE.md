# app/(dashboard)/scenarios/ — 시나리오 라우트

## 파일 구조
| 파일 | 역할 |
|------|------|
| `page.tsx` | 서버 — 시나리오 목록 + 스텝/등록 카운트 fetch |
| `ScenariosClient.tsx` | 클라이언트 — 목록 UI |
| `new/page.tsx` | 서버 — 연동 정보 + 유입경로 fetch |
| `new/ScenarioCreateClient.tsx` | 클라이언트 — 시나리오 빌더 (기본 정보 + 트리거 + 스텝 편집기) |
| `[scenarioId]/page.tsx` | 서버 — 시나리오 + 스텝 + 등록 현황 fetch |
| `[scenarioId]/ScenarioDetailClient.tsx` | 클라이언트 — 타임라인 + 등록 리드 + 수동 등록 모달 |

## 시나리오 흐름
1. `/scenarios/new` — 시나리오 생성 (이름, 트리거, 스텝 D+N)
2. 리드 생성 시 자동 enrollment (또는 상세 페이지에서 수동 등록)
3. Vercel Cron (`/api/cron/scenarios`) → 10분 간격 D+N 조건 체크 → Solapi 발송
4. `/scenarios/[id]` — 타임라인 + 등록 리드 상태 확인

## 트리거
- `auto_on_create`: 리드 생성 시 자동 등록 (유입경로 필터 가능)
- `manual`: 상세 페이지에서 수동 등록

## 타입
- `Scenario`, `ScenarioStep`, `ScenarioEnrollment`, `ScenarioLog` from `@/types`
