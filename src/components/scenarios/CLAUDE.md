# components/scenarios/ — 시나리오 컴포넌트

## 컴포넌트 목록
| 파일 | 역할 |
|------|------|
| `ScenarioCard.tsx` | 시나리오 카드 (이름, 트리거, 스텝 수, 등록 수, 활성 Switch) |
| `StepEditor.tsx` | 스텝 편집기 (D+N일, TemplateEditor 재사용) |
| `ScenarioTimeline.tsx` | 스텝 타임라인 시각화 (D+0 → D+1 → D+3) |
| `EnrollmentTable.tsx` | 등록된 리드 목록 테이블 (진행 상태, 등록일) |

## 재사용
- `TemplateEditor` from `@/components/campaigns/` — 스텝 메시지 편집 시 재사용
- `detectMessageType`, `getByteLength` from `@/lib/campaigns/variables` — 바이트 표시

## 타입
- `Scenario`, `ScenarioStep` from `@/types`
- `StepData` from `StepEditor.tsx` (로컬 타입)
