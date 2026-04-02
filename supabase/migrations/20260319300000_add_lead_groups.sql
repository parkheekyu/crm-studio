-- ============================================================
-- Lead Groups + Memberships (1:N)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.lead_groups (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  color        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lead_groups_workspace_id_idx
  ON public.lead_groups(workspace_id);

CREATE TABLE IF NOT EXISTS public.lead_group_memberships (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.lead_groups(id) ON DELETE CASCADE,
  lead_id  UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, lead_id)
);

CREATE INDEX IF NOT EXISTS lead_group_memberships_lead_id_idx
  ON public.lead_group_memberships(lead_id);

CREATE INDEX IF NOT EXISTS lead_group_memberships_group_id_idx
  ON public.lead_group_memberships(group_id);

-- RLS
ALTER TABLE public.lead_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_group_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_groups_workspace_access" ON public.lead_groups
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "lead_group_memberships_access" ON public.lead_group_memberships
  FOR ALL USING (
    group_id IN (
      SELECT id FROM public.lead_groups
      WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );
