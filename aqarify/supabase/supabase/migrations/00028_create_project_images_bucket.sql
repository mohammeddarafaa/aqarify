-- Project images bucket for project CRUD.
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "project_images_read_public" ON storage.objects;
CREATE POLICY "project_images_read_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-images');

DROP POLICY IF EXISTS "project_images_insert_staff" ON storage.objects;
CREATE POLICY "project_images_insert_staff"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-images'
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('manager', 'admin', 'super_admin')
      AND split_part(name, '/', 1) = u.tenant_id::text
  )
);

DROP POLICY IF EXISTS "project_images_update_staff" ON storage.objects;
CREATE POLICY "project_images_update_staff"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-images'
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('manager', 'admin', 'super_admin')
      AND split_part(name, '/', 1) = u.tenant_id::text
  )
)
WITH CHECK (
  bucket_id = 'project-images'
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('manager', 'admin', 'super_admin')
      AND split_part(name, '/', 1) = u.tenant_id::text
  )
);

DROP POLICY IF EXISTS "project_images_delete_staff" ON storage.objects;
CREATE POLICY "project_images_delete_staff"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-images'
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('manager', 'admin', 'super_admin')
      AND split_part(name, '/', 1) = u.tenant_id::text
  )
);
