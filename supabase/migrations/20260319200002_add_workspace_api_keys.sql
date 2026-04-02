-- ============================================================
-- Workspace API Keys — 외부 리드 연동용
-- ============================================================

CREATE TABLE IF NOT EXISTS public.workspace_api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT 'Default',
  key_hash      TEXT NOT NULL,
  key_prefix    TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS workspace_api_keys_workspace_id_idx
  ON public.workspace_api_keys(workspace_id);

CREATE INDEX IF NOT EXISTS workspace_api_keys_key_hash_idx
  ON public.workspace_api_keys(key_hash);

ALTER TABLE public.workspace_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ws_api_keys_access" ON public.workspace_api_keys
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );
