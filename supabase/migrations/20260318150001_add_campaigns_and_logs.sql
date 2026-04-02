-- ============================================================
-- Phase 3 — campaigns + message_logs 테이블
-- ============================================================

CREATE TABLE IF NOT EXISTS public.campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  message_type    TEXT NOT NULL DEFAULT 'SMS',
  message_content TEXT NOT NULL DEFAULT '',
  kakao_options   JSONB,
  status          TEXT NOT NULL DEFAULT 'draft',
  target_filter   JSONB,
  scheduled_at    TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  total_count     INT NOT NULL DEFAULT 0,
  success_count   INT NOT NULL DEFAULT 0,
  fail_count      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS campaigns_workspace_id_idx ON public.campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS campaigns_created_at_idx ON public.campaigns(workspace_id, created_at DESC);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_workspace_access" ON public.campaigns
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================

CREATE TABLE IF NOT EXISTS public.message_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  campaign_id       UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_id           UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  phone             TEXT NOT NULL,
  lead_name         TEXT,
  status            TEXT NOT NULL DEFAULT 'pending',
  solapi_message_id TEXT,
  error_message     TEXT,
  sent_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS message_logs_campaign_id_idx ON public.message_logs(campaign_id);
CREATE INDEX IF NOT EXISTS message_logs_workspace_id_idx ON public.message_logs(workspace_id);

ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message_logs_workspace_access" ON public.message_logs
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );
