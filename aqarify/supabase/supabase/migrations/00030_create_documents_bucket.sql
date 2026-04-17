-- Private bucket for receipts and uploads (server uses service role)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "documents_tenant_read" ON storage.objects;
CREATE POLICY "documents_tenant_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = (
      SELECT tenant_id::text FROM public.users WHERE id = auth.uid() LIMIT 1
    )
  );

DROP POLICY IF EXISTS "documents_tenant_upload" ON storage.objects;
CREATE POLICY "documents_tenant_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = (
      SELECT tenant_id::text FROM public.users WHERE id = auth.uid() LIMIT 1
    )
  );
