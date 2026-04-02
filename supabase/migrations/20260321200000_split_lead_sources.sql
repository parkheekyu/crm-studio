-- 리드 수집 채널 테이블
CREATE TABLE lead_sources (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'form',
  fields       JSONB NOT NULL DEFAULT '[]'::jsonb,
  config       JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace members can manage lead_sources"
  ON lead_sources FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- landing_forms에 컬럼 추가
ALTER TABLE landing_forms
  ADD COLUMN lead_source_id UUID REFERENCES lead_sources(id) ON DELETE SET NULL,
  ADD COLUMN thank_you_type TEXT NOT NULL DEFAULT 'default',
  ADD COLUMN thank_you_value TEXT;

-- 기존 landing_forms → lead_sources 데이터 마이그레이션
DO $$
DECLARE r RECORD; new_id UUID;
BEGIN
  FOR r IN SELECT * FROM landing_forms LOOP
    new_id := gen_random_uuid();
    INSERT INTO lead_sources (id, workspace_id, title, type, fields, is_active, created_at)
    VALUES (new_id, r.workspace_id, r.title, 'form', r.fields, r.is_active, r.created_at);
    UPDATE landing_forms SET lead_source_id = new_id WHERE id = r.id;
  END LOOP;
END $$;
