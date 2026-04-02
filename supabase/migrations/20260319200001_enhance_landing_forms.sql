-- ============================================================
-- Landing Forms 확장 — 이미지 + Pixel + 설정
-- ============================================================

ALTER TABLE public.landing_forms
  ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS pixel_id TEXT,
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb;

-- images:  ["https://...1.jpg", "https://...2.jpg"]
-- pixel_id: Facebook Pixel ID
-- settings: 향후 확장 (감사 메시지, 리다이렉트 URL 등)
