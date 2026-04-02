-- 리드 수집 채널에 그룹 연결
ALTER TABLE lead_sources
  ADD COLUMN group_id UUID REFERENCES lead_groups(id) ON DELETE SET NULL;
