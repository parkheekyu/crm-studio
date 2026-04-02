-- ============================================================
-- Phase 2 — landing_forms 테이블 (외부 수집 폼)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.landing_forms (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  slug          TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  description   TEXT,
  fields        JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS landing_forms_workspace_id_idx ON public.landing_forms(workspace_id);

ALTER TABLE public.landing_forms ENABLE ROW LEVEL SECURITY;

-- 워크스페이스 멤버 CRUD
CREATE POLICY "landing_forms_workspace_access" ON public.landing_forms
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- 공개 폼 조회 (비로그인 접근용)
CREATE POLICY "landing_forms_public_read" ON public.landing_forms
  FOR SELECT USING (is_active = true);
