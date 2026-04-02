-- 시나리오 정의
CREATE TABLE IF NOT EXISTS public.scenarios (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  trigger_type    TEXT NOT NULL DEFAULT 'auto_on_create',  -- auto_on_create, manual
  trigger_filter  JSONB,           -- { source?: string } — 특정 유입경로만 자동등록
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 시나리오 스텝 (D+N일에 어떤 메시지를 보낼지)
CREATE TABLE IF NOT EXISTS public.scenario_steps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id     UUID NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
  step_order      INT NOT NULL DEFAULT 0,
  delay_days      INT NOT NULL DEFAULT 0,       -- D+0, D+1, D+3 ...
  message_type    TEXT NOT NULL DEFAULT 'SMS',   -- SMS, LMS, ATA, FTA
  message_content TEXT NOT NULL DEFAULT '',
  kakao_options   JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 리드별 시나리오 등록 상태
CREATE TABLE IF NOT EXISTS public.scenario_enrollments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  scenario_id     UUID NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
  lead_id         UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  enrolled_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_step    INT NOT NULL DEFAULT 0,        -- 다음 실행할 step_order
  status          TEXT NOT NULL DEFAULT 'active', -- active, completed, cancelled
  completed_at    TIMESTAMPTZ,
  UNIQUE(scenario_id, lead_id)
);

-- 시나리오 발송 로그
CREATE TABLE IF NOT EXISTS public.scenario_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  enrollment_id   UUID NOT NULL REFERENCES public.scenario_enrollments(id) ON DELETE CASCADE,
  step_id         UUID NOT NULL REFERENCES public.scenario_steps(id) ON DELETE CASCADE,
  lead_id         UUID NOT NULL REFERENCES public.leads(id) ON DELETE SET NULL,
  phone           TEXT NOT NULL,
  lead_name       TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',  -- pending, sent, failed
  error_message   TEXT,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_access" ON public.scenarios
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "workspace_access" ON public.scenario_steps
  FOR ALL USING (scenario_id IN (
    SELECT id FROM public.scenarios WHERE workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "workspace_access" ON public.scenario_enrollments
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "workspace_access" ON public.scenario_logs
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  ));
