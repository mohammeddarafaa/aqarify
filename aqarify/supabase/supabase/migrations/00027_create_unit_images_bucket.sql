-- Unit images bucket for manager/admin uploads from dashboard.
INSERT INTO storage.buckets (id, name, public)
VALUES ('unit-images', 'unit-images', true)
ON CONFLICT (id) DO NOTHING;

-- Read access for unit-images objects.
DROP POLICY IF EXISTS "unit_images_read_public" ON storage.objects;
CREATE POLICY "unit_images_read_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'unit-images');

-- Write access restricted to tenant staff roles and tenant-prefixed object keys.
DROP POLICY IF EXISTS "unit_images_insert_staff" ON storage.objects;
CREATE POLICY "unit_images_insert_staff"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'unit-images'
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('manager', 'admin', 'super_admin')
      AND split_part(name, '/', 1) = u.tenant_id::text
  )
);

DROP POLICY IF EXISTS "unit_images_update_staff" ON storage.objects;
CREATE POLICY "unit_images_update_staff"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'unit-images'
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('manager', 'admin', 'super_admin')
      AND split_part(name, '/', 1) = u.tenant_id::text
  )
)
WITH CHECK (
  bucket_id = 'unit-images'
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('manager', 'admin', 'super_admin')
      AND split_part(name, '/', 1) = u.tenant_id::text
  )
);

DROP POLICY IF EXISTS "unit_images_delete_staff" ON storage.objects;
CREATE POLICY "unit_images_delete_staff"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'unit-images'
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('manager', 'admin', 'super_admin')
      AND split_part(name, '/', 1) = u.tenant_id::text
  )
);
