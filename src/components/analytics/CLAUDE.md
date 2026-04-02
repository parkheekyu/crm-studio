# components/analytics/ — 성과 분석 컴포넌트

## 컴포넌트 목록
| 파일 | 역할 |
|------|------|
| `StatCard.tsx` | 재사용 스탯 카드 (아이콘 + 수치 + 라벨 + 부가정보) |
| `DailySendChart.tsx` | recharts BarChart — 일별 캠페인/시나리오 발송 추이 (stacked) |
| `MessageTypeChart.tsx` | recharts PieChart — SMS/LMS/ATA/FTA 유형별 분포 |
| `CampaignTable.tsx` | 캠페인 성과 테이블 (이름, 유형, 성공/실패, 성공률) |
| `ScenarioTable.tsx` | 시나리오 성과 테이블 (등록/완료, 완료율, 발송 성공/실패) |

## 차트 라이브러리
- `recharts` 사용 (직접 import, shadcn 래퍼 없음)
- 캠페인 색상: `#3182f6` (primary), 시나리오 색상: `#a78bfa` (violet)

## 타입
- `@/types/analytics` — AnalyticsSummary, DailySendData, CampaignPerformance, ScenarioPerformance, MessageTypeDistribution
