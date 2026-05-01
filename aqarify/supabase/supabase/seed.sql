-- Aqarify Platform Seed Data
-- Demo tenants: K-Developments (Growth plan), Roya (Starter plan),
-- Expired-Demo (read-only, for subscription-expiry testing)
-- Run: supabase db reset (applies migrations + this seed)

-- ==========================================================
-- SUBSCRIPTION PLANS
-- ==========================================================
INSERT INTO subscription_plans (id, code, name, description, price_egp_monthly, price_egp_yearly, max_units, max_users, max_projects, features, sort_order)
VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'starter', 'Starter',
   'For small developers getting started online.',
    2500.00,  25000.00,    50,  3,  1,
   '{"custom_domain": false, "white_label": false, "api_access": false, "priority_support": false, "reports": true, "map_view": true}', 1),
  ('00000000-0000-0000-0000-0000000000a2', 'growth', 'Growth',
   'Full CRM + branding for established developers.',
    6500.00,  65000.00,   500, 15,  5,
   '{"custom_domain": true, "white_label": false, "api_access": true, "priority_support": true, "reports": true, "map_view": true}', 2),
  ('00000000-0000-0000-0000-0000000000a3', 'pro', 'Pro',
   'Unlimited scale, white-label, dedicated support.',
   14500.00, 145000.00, 99999, 99999, 99999,
   '{"custom_domain": true, "white_label": true, "api_access": true, "priority_support": true, "reports": true, "map_view": true}', 3);

-- ==========================================================
-- TENANT 1: K-Developments (active, Growth plan)
-- ==========================================================
INSERT INTO tenants (id, name, slug, logo_url, theme_config, filter_schema, contact_phone, contact_email, address, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'K-Developments',
  'kdevelopments',
  'https://placehold.co/200x60?text=K-Dev',
  '{"primary_color":"#1a56db","secondary_color":"#374151","accent_color":"#f59e0b","font_family":"Cairo"}',
  '{
    "filters": [
      {"key":"type","label":"نوع الوحدة","type":"dropdown","options":["شقة","فيلا","دوبلكس","بنتهاوس"],"default":"all"},
      {"key":"bedrooms","label":"عدد الغرف","type":"dropdown","options":["1","2","3","4"],"default":"all"},
      {"key":"location","label":"الموقع","type":"dropdown","options":["القاهرة الجديدة","الشروق","مدينتي"],"default":"all"}
    ],
    "has_search": true,
    "has_map_view": true,
    "has_clear_button": true
  }',
  '+201000000001',
  'info@kdevelopments.eg',
  'القاهرة الجديدة، مصر',
  'active'
);

-- Demo project
INSERT INTO projects (id, tenant_id, name, description, location_lat, location_lng, address, total_units, cover_image_url, gallery, status)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'مشروع النخيل',
  'مشروع سكني راقٍ في قلب القاهرة الجديدة',
  30.0596,
  31.4997,
  'القاهرة الجديدة، التجمع الخامس',
  20,
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80',
  '[
    "https://images.unsplash.com/photo-1545324418-cc1a3faf10e4?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1564013799919-def615e8751b?auto=format&fit=crop&w=1400&q=80"
  ]'::jsonb,
  'active'
);

-- Demo buildings
INSERT INTO buildings (id, tenant_id, project_id, name, number, total_floors, total_units)
VALUES
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'برج A', 'A', 8, 8),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'برج B', 'B', 8, 8),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'برج C', 'C', 4, 4);

-- Demo units (20 units across 3 buildings)
INSERT INTO units (tenant_id, project_id, building_id, unit_number, floor, type, bedrooms, bathrooms, balconies, size_sqm, view_type, finishing, price, reservation_fee, down_payment_pct, installment_months, status)
VALUES
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000020','A-101',1,'شقة',2,1,1,110,'حديقة','نصف تشطيب',2500000,50000,10,60,'available'),
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000020','A-201',2,'شقة',3,2,1,145,'بحري','نصف تشطيب',3200000,64000,10,60,'available'),
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000020','A-301',3,'شقة',3,2,2,150,'بحري','كامل التشطيب',3800000,76000,15,72,'reserved'),
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000020','A-401',4,'شقة',4,3,2,200,'بانوراما','كامل التشطيب',5200000,104000,20,84,'available'),
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000021','B-101',1,'شقة',2,1,1,115,'حديقة','نصف تشطيب',2600000,52000,10,60,'available'),
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000021','B-201',2,'شقة',3,2,1,148,'بحري','نصف تشطيب',3300000,66000,10,60,'sold'),
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000021','B-501',5,'دوبلكس',4,3,3,280,'بانوراما','كامل التشطيب',7500000,150000,20,84,'available'),
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000021','B-801',8,'بنتهاوس',5,4,4,380,'بانوراما','كامل التشطيب',12000000,240000,25,96,'available'),
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000022','C-101',1,'فيلا',4,3,2,320,'حديقة خاصة','كامل التشطيب',9500000,190000,20,84,'available'),
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000022','C-201',2,'فيلا',5,4,3,420,'حديقة خاصة','كامل التشطيب',13000000,260000,25,96,'available');

-- Map pins (requires migration 00029_add_unit_location_lat_lng.sql)
UPDATE units SET location_lat = 30.0626, location_lng = 31.2497 WHERE tenant_id = '00000000-0000-0000-0000-000000000001' AND unit_number = 'A-101';
UPDATE units SET location_lat = 30.0628, location_lng = 31.2501 WHERE tenant_id = '00000000-0000-0000-0000-000000000001' AND unit_number = 'B-101';
UPDATE units SET location_lat = 30.0630, location_lng = 31.2495 WHERE tenant_id = '00000000-0000-0000-0000-000000000001' AND unit_number = 'C-101';

UPDATE units SET gallery = CASE unit_number
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
  ELSE gallery
END
WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- Active subscription for K-Developments
INSERT INTO tenant_subscriptions (id, tenant_id, plan_id, status, billing_cycle, amount_egp, current_period_start, current_period_end)
VALUES (
  '00000000-0000-0000-0000-0000000000b1',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-0000000000a2',
  'active', 'monthly', 6500.00,
  now(), now() + INTERVAL '30 days'
);

-- ==========================================================
-- TENANT 2: Roya Developments (active, Starter plan)
-- ==========================================================
INSERT INTO tenants (id, name, slug, logo_url, theme_config, filter_schema, contact_phone, contact_email, address, status)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Roya Developments',
  'roya-developments',
  'https://placehold.co/200x60?text=Roya',
  '{"primary_color":"#0f766e","secondary_color":"#334155","accent_color":"#ea580c","font_family":"Cairo"}',
  '{"filters":[
    {"key":"type","label":"Type","type":"dropdown","options":["Apartment","Villa","Townhouse"],"default":"all"},
    {"key":"bedrooms","label":"Bedrooms","type":"dropdown","options":["1","2","3","4"],"default":"all"}
  ],"has_search":true,"has_map_view":true,"has_clear_button":true}',
  '+201000000002', 'hello@roya.eg', 'Sheikh Zayed, Egypt', 'active'
);

INSERT INTO projects (id, tenant_id, name, description, location_lat, location_lng, address, total_units, cover_image_url, gallery, status)
VALUES (
  '00000000-0000-0000-0000-000000000030',
  '00000000-0000-0000-0000-000000000002',
  'Palm Residences',
  'Gated community in Sheikh Zayed.',
  30.0720, 30.9710,
  'Sheikh Zayed City',
  10,
  'https://images.unsplash.com/photo-1600210492486-724fe5c4f653?auto=format&fit=crop&w=1400&q=80',
  '[
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1400&q=80"
  ]'::jsonb,
  'active'
);

INSERT INTO buildings (id, tenant_id, project_id, name, number, total_floors, total_units)
VALUES
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000030', 'Block 1', '1', 5, 5),
  ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000030', 'Block 2', '2', 5, 5);

INSERT INTO units (tenant_id, project_id, building_id, unit_number, floor, type, bedrooms, bathrooms, balconies, size_sqm, view_type, finishing, price, reservation_fee, down_payment_pct, installment_months, status)
VALUES
  ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000030','00000000-0000-0000-0000-000000000040','1-101',1,'Apartment',2,2,1,120,'Garden','Semi-finished',3100000,60000,10,60,'available'),
  ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000030','00000000-0000-0000-0000-000000000040','1-201',2,'Apartment',3,2,1,155,'Pool','Fully-finished',4200000,80000,15,72,'available'),
  ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000030','00000000-0000-0000-0000-000000000040','1-301',3,'Apartment',3,3,2,175,'Pool','Fully-finished',5100000,100000,15,84,'available'),
  ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000030','00000000-0000-0000-0000-000000000041','2-101',1,'Apartment',2,2,1,118,'Garden','Semi-finished',3000000,60000,10,60,'available'),
  ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000030','00000000-0000-0000-0000-000000000041','2-201',2,'Townhouse',3,3,2,190,'Landscape','Fully-finished',5600000,110000,15,84,'reserved');

UPDATE units SET gallery = CASE unit_number
  WHEN '1-101' THEN '["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80"]'::jsonb
  WHEN '1-201' THEN '["https://images.unsplash.com/photo-1600566753376-12c08abfdd18?auto=format&fit=crop&w=1200&q=80"]'::jsonb
  WHEN '1-301' THEN '["https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80"]'::jsonb
  WHEN '2-101' THEN '["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80"]'::jsonb
  WHEN '2-201' THEN '["https://images.unsplash.com/photo-1600607687644-aac4c3eabc7f?auto=format&fit=crop&w=1200&q=80"]'::jsonb
  ELSE gallery
END
WHERE tenant_id = '00000000-0000-0000-0000-000000000002';

INSERT INTO tenant_subscriptions (id, tenant_id, plan_id, status, billing_cycle, amount_egp, current_period_start, current_period_end)
VALUES (
  '00000000-0000-0000-0000-0000000000b2',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-0000000000a1',
  'active', 'monthly', 2500.00,
  now(), now() + INTERVAL '30 days'
);

-- ==========================================================
-- TENANT 3: Expired-Demo (read_only, to test lapsed subscription UX)
-- ==========================================================
INSERT INTO tenants (id, name, slug, logo_url, theme_config, filter_schema, contact_phone, contact_email, address, status)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'Expired Demo Co.',
  'expired-demo',
  'https://placehold.co/200x60?text=Expired',
  '{"primary_color":"#64748b","secondary_color":"#334155","accent_color":"#94a3b8","font_family":"Cairo"}',
  '{"filters":[],"has_search":true,"has_map_view":false,"has_clear_button":true}',
  '+201000000003', 'info@expired.eg', 'Cairo, Egypt', 'read_only'
);

INSERT INTO tenant_subscriptions (id, tenant_id, plan_id, status, billing_cycle, amount_egp, current_period_start, current_period_end)
VALUES (
  '00000000-0000-0000-0000-0000000000b3',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-0000000000a1',
  'expired', 'monthly', 2500.00,
  now() - INTERVAL '60 days', now() - INTERVAL '10 days'
);

INSERT INTO projects (id, tenant_id, name, description, location_lat, location_lng, address, total_units, cover_image_url, gallery, status)
VALUES (
  '00000000-0000-0000-0000-000000000050',
  '00000000-0000-0000-0000-000000000003',
  'Paused Heights',
  'Read-only tenant project for subscription lapse testing.',
  30.0400, 31.2400,
  'Nasr City, Cairo',
  2,
  'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1400&q=80',
  '["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80"]'::jsonb,
  'active'
);

INSERT INTO buildings (id, tenant_id, project_id, name, number, total_floors, total_units)
VALUES
  ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000050', 'Block E', 'E', 3, 2);

INSERT INTO units (tenant_id, project_id, building_id, unit_number, floor, type, bedrooms, bathrooms, balconies, size_sqm, view_type, finishing, price, reservation_fee, down_payment_pct, installment_months, status)
VALUES
  ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000050','00000000-0000-0000-0000-000000000051','E-101',1,'Apartment',2,1,1,105,'Street','Semi-finished',2400000,50000,10,60,'available'),
  ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000050','00000000-0000-0000-0000-000000000051','E-201',2,'Apartment',3,2,1,138,'Street','Semi-finished',3200000,64000,10,60,'available');

UPDATE units SET gallery = CASE unit_number
  WHEN 'E-101' THEN '["https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80"]'::jsonb
  WHEN 'E-201' THEN '["https://images.unsplash.com/photo-1600047509358-9dc755e1e0d0?auto=format&fit=crop&w=1200&q=80"]'::jsonb
  ELSE gallery
END
WHERE tenant_id = '00000000-0000-0000-0000-000000000003';

-- NOTE: auth.users cannot be safely seeded with deterministic passwords in SQL-only
-- bootstrap. Wave 5 E2E setup provisions role users through Supabase Admin API.
