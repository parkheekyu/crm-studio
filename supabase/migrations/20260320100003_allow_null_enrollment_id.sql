-- 일괄 발송(scheduled) 시나리오는 enrollment 없이 직접 발송하므로
-- scenario_logs.enrollment_id를 nullable로 변경
ALTER TABLE scenario_logs ALTER COLUMN enrollment_id DROP NOT NULL;
