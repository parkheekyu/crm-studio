-- ============================================================
-- Landing Images Storage Bucket
-- ============================================================

-- 공개 버킷 생성 (10MB 제한, 이미지만)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'landing-images',
  'landing-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- 워크스페이스 멤버만 업로드 (경로: {workspace_id}/...)
CREATE POLICY "ws_members_upload" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'landing-images'
  AND (storage.foldername(name))[1] IN (
    SELECT workspace_id::text FROM public.workspace_members
    WHERE user_id = auth.uid()
  )
);

-- 워크스페이스 멤버만 삭제
CREATE POLICY "ws_members_delete" ON storage.objects FOR DELETE
USING (
  bucket_id = 'landing-images'
  AND (storage.foldername(name))[1] IN (
    SELECT workspace_id::text FROM public.workspace_members
    WHERE user_id = auth.uid()
  )
);

-- 공개 읽기
CREATE POLICY "public_read_landing_images" ON storage.objects FOR SELECT
USING (bucket_id = 'landing-images');
