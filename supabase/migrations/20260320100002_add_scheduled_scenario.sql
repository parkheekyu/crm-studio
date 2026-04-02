-- 시나리오 타입 (순차 발송 vs 일괄 발송)
ALTER TABLE scenarios ADD COLUMN scenario_type TEXT NOT NULL DEFAULT 'sequential';
-- 'sequential' = 리드 등록 시점 기준 D+N 순차 발송
-- 'scheduled' = 지정 날짜/시간에 일괄 발송

-- 스텝별 발송 예정 시각 (일괄 발송용)
ALTER TABLE scenario_steps ADD COLUMN scheduled_at TIMESTAMPTZ;

-- 스텝별 타겟 필터 (일괄 발송에서 스텝마다 다른 세그먼트)
-- 형식: { "type": "all" } | { "type": "group", "group_id": "..." } | { "type": "source", "source": "..." }
ALTER TABLE scenario_steps ADD COLUMN target_filter JSONB;
