# app/(dashboard)/analytics/ — 성과 분석 라우트

## 파일 구조
| 파일 | 역할 |
|------|------|
| `page.tsx` | 서버 — 5개 fetch 함수 병렬 호출 (Promise.all) |
| `AnalyticsClient.tsx` | 클라이언트 — 요약 카드 + 차트 + 테이블 레이아웃 |

## 데이터 흐름
1. `page.tsx`에서 `fetchAnalyticsSummary`, `fetchDailySendTrend`, `fetchCampaignPerformances`, `fetchScenarioPerformances`, `fetchMessageTypeDistribution` 병렬 호출
2. 모든 집계는 `src/lib/analytics/fetch-analytics.ts`에서 JS reduce/Map으로 처리
3. 결과를 `AnalyticsClient`에 props로 전달

## 레이아웃
1. 요약 카드 4개 (총 발송, 성공률, 실패 수, 시나리오 완료율)
2. 일별 발송 추이 (recharts BarChart, 최근 30일)
3. 메시지 유형 분포 (recharts PieChart)
4. 캠페인별 성과 테이블
5. 시나리오별 성과 테이블

## 타입
- `AnalyticsSummary`, `DailySendData`, `CampaignPerformance`, `ScenarioPerformance`, `MessageTypeDistribution` from `@/types/analytics`
