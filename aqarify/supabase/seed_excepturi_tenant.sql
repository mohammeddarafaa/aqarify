-- Optional: demo tenant matching slug `excepturi` (e.g. RAMOS CONNER TRADERS) + sample inventory.
-- Run in Supabase SQL Editor against your project (after migrations), or merge into seed.sql.
-- Requires subscription_plans rows (from main seed) for FK on tenant_subscriptions.

INSERT INTO tenants (id, name, slug, logo_url, theme_config, filter_schema, contact_phone, contact_email, address, status)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001',
  'RAMOS CONNER TRADERS',
  'excepturi',
  NULL,
  '{"primary_color":"#141414","secondary_color":"#64748b","accent_color":"#B8892E","font_family":"Cairo"}',
  '{
    "filters": [
      {"key":"type","label":"نوع الوحدة","type":"dropdown","options":["شقة","فيلا","دوبلكس"],"default":"all"},
      {"key":"bedrooms","label":"عدد الغرف","type":"dropdown","options":["1","2","3","4"],"default":"all"}
    ],
    "has_search": true,
    "has_map_view": true,
    "has_clear_button": true
  }',
  '+201000009999',
  'sales@ramos-conner.example',
  'مصر',
  'active'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  contact_phone = EXCLUDED.contact_phone,
  contact_email = EXCLUDED.contact_email,
  address = EXCLUDED.address,
  status = EXCLUDED.status;

-- Subscription (Growth plan id from default seed.sql — change if your plan UUIDs differ)
INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, billing_cycle, amount_egp, current_period_start, current_period_end)
SELECT
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001',
  '00000000-0000-0000-0000-0000000000a2',
  'active',
  'monthly',
  6500.00,
  now(),
  now() + interval '30 days'
WHERE NOT EXISTS (
  SELECT 1 FROM tenant_subscriptions ts
  WHERE ts.tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001'
    AND ts.status IN ('active', 'past_due')
);

INSERT INTO projects (id, tenant_id, name, description, location_lat, location_lng, address, total_units, cover_image_url, status)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0010',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001',
  'Ramos Gate',
  'مجمع سكني تجريبي للاختبار المحلي',
  30.0444,
  31.2357,
  'القاهرة، مصر',
  12,
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
  'active'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO buildings (id, tenant_id, project_id, name, number, total_floors, total_units)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0020',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0010',
  'البرج الرئيسي',
  'A',
  6,
  12
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO units (
  tenant_id, project_id, building_id, unit_number, floor, type, bedrooms, bathrooms, balconies,
  size_sqm, view_type, finishing, price, reservation_fee, down_payment_pct, installment_months, status, gallery
)
SELECT * FROM (VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0010'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0020'::uuid,
    'A-101',
    1,
    'شقة',
    2,
    1,
    1,
    120::numeric,
    'حديقة',
    'كامل التشطيب',
    3200000::numeric,
    64000::numeric,
    15::numeric,
    72,
    'available'::unit_status,
    '["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"]'::jsonb
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0010'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0020'::uuid,
    'A-205',
    2,
    'شقة',
    3,
    2,
    1,
    155::numeric,
    'بحري',
    'كامل التشطيب',
    4100000::numeric,
    82000::numeric,
    15::numeric,
    84,
    'available'::unit_status,
    '["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80"]'::jsonb
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0010'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0020'::uuid,
    'A-402',
    4,
    'دوبلكس',
    4,
    3,
    2,
    220::numeric,
    'بانوراما',
    'كامل التشطيب',
    7800000::numeric,
    156000::numeric,
    20::numeric,
    96,
    'available'::unit_status,
    '["https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80"]'::jsonb
  )
) AS v(tenant_id, project_id, building_id, unit_number, floor, type, bedrooms, bathrooms, balconies, size_sqm, view_type, finishing, price, reservation_fee, down_payment_pct, installment_months, status, gallery)
WHERE NOT EXISTS (
  SELECT 1 FROM units u
  WHERE u.tenant_id = v.tenant_id AND u.building_id = v.building_id AND u.unit_number = v.unit_number
);
