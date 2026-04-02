-- ============================================================
-- Phase 3 — workspace_integrations 테이블
-- ============================================================

CREATE TABLE IF NOT EXISTS public.workspace_integrations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL,
  config        JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, provider)
);

CREATE INDEX IF NOT EXISTS workspace_integrations_workspace_id_idx
  ON public.workspace_integrations(workspace_id);

ALTER TABLE public.workspace_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_integrations_workspace_access"
  ON public.workspace_integrations
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );
