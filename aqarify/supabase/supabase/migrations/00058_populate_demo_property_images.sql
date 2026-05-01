-- Populate project covers / galleries and unit galleries for seeded demo tenants
-- when imagery is still placeholders or empty. Cover vs gallery URLs differ; units vary by unit_number.

UPDATE projects p
SET
  cover_image_url = CASE
    WHEN (p.cover_image_url LIKE '%placehold%' OR nullif(trim(p.cover_image_url), '') IS NULL)
    THEN 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80'
    ELSE p.cover_image_url
  END,
  gallery = CASE
    WHEN COALESCE(jsonb_array_length(p.gallery), 0) = 0 THEN '[
      "https://images.unsplash.com/photo-1545324418-cc1a3faf10e4?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1564013799919-def615e8751b?auto=format&fit=crop&w=1400&q=80"
    ]'::jsonb
    ELSE p.gallery
  END
FROM tenants t
WHERE p.tenant_id = t.id
  AND t.slug = 'kdevelopments'
  AND (
    p.cover_image_url LIKE '%placehold%'
    OR nullif(trim(p.cover_image_url), '') IS NULL
    OR COALESCE(jsonb_array_length(p.gallery), 0) = 0
  );

UPDATE units u
SET gallery = CASE u.unit_number
  WHEN 'A-101' THEN '["https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80"]'::jsonb
  WHEN 'A-201' THEN '["https://images.unsplash.com/photo-1600566753376-12c08abfdd18?auto=format&fit=crop&w=1200&q=80"]'::jsonb
  WHEN 'A-301' THEN '["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80"]'::jsonb
  WHEN 'A-401' THEN '["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"]'::jsonb
  WHEN 'B-101' THEN '["https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80"]'::jsonb
  WHEN 'B-201' THEN '["https://images.unsplash.com/photo-1600210492486-724fe5c4f653?auto=format&fit=crop&w=1200&q=80"]'::jsonb
  WHEN 'B-501' THEN '["https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80"]'::jsonb
  WHEN 'B-801' THEN '["https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80"]'::jsonb
  WHEN 'C-101' THEN '["https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80"]'::jsonb
  WHEN 'C-201' THEN '["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80"]'::jsonb
  ELSE u.gallery
END
FROM tenants t
WHERE u.tenant_id = t.id
  AND t.slug = 'kdevelopments'
  AND COALESCE(jsonb_array_length(u.gallery), 0) = 0;

UPDATE projects p
SET
  cover_image_url = CASE
    WHEN (p.cover_image_url LIKE '%placehold%' OR nullif(trim(p.cover_image_url), '') IS NULL)
    THEN 'https://images.unsplash.com/photo-1600210492486-724fe5c4f653?auto=format&fit=crop&w=1400&q=80'
    ELSE p.cover_image_url
  END,
  gallery = CASE
    WHEN COALESCE(jsonb_array_length(p.gallery), 0) = 0 THEN '[
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1400&q=80"
    ]'::jsonb
    ELSE p.gallery
  END
FROM tenants t
WHERE p.tenant_id = t.id
  AND t.slug = 'roya-developments'
  AND (
    p.cover_image_url LIKE '%placehold%'
    OR nullif(trim(p.cover_image_url), '') IS NULL
    OR COALESCE(jsonb_array_length(p.gallery), 0) = 0
  );

UPDATE units u
SET gallery = CASE u.unit_number
  WHEN '1-101' THEN '["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80"]'::jsonb
  WHEN '1-201' THEN '["https://images.unsplash.com/photo-1600566753376-12c08abfdd18?auto=format&fit=crop&w=1200&q=80"]'::jsonb
  WHEN '1-301' THEN '["https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80"]'::jsonb
  WHEN '2-101' THEN '["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80"]'::jsonb
  WHEN '2-201' THEN '["https://images.unsplash.com/photo-1600607687644-aac4c3eabc7f?auto=format&fit=crop&w=1200&q=80"]'::jsonb
  ELSE u.gallery
END
FROM tenants t
WHERE u.tenant_id = t.id
  AND t.slug = 'roya-developments'
  AND COALESCE(jsonb_array_length(u.gallery), 0) = 0;

UPDATE projects p
SET
  cover_image_url = CASE
    WHEN (p.cover_image_url LIKE '%placehold%' OR nullif(trim(p.cover_image_url), '') IS NULL)
    THEN 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1400&q=80'
    ELSE p.cover_image_url
  END,
  gallery = CASE
    WHEN COALESCE(jsonb_array_length(p.gallery), 0) = 0 THEN
      '["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80"]'::jsonb
    ELSE p.gallery
  END
FROM tenants t
WHERE p.tenant_id = t.id
  AND t.slug = 'expired-demo'
  AND (
    p.cover_image_url LIKE '%placehold%'
    OR nullif(trim(p.cover_image_url), '') IS NULL
    OR COALESCE(jsonb_array_length(p.gallery), 0) = 0
  );

UPDATE units u
SET gallery = CASE u.unit_number
  WHEN 'E-101' THEN '["https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80"]'::jsonb
  WHEN 'E-201' THEN '["https://images.unsplash.com/photo-1600047509358-9dc755e1e0d0?auto=format&fit=crop&w=1200&q=80"]'::jsonb
  ELSE u.gallery
END
FROM tenants t
WHERE u.tenant_id = t.id
  AND t.slug = 'expired-demo'
  AND COALESCE(jsonb_array_length(u.gallery), 0) = 0;
