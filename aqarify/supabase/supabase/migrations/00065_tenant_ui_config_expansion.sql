-- Migration: 00065_tenant_ui_config_expansion.sql
-- Description: Adds stats and value_cards to tenant ui_config to remove hardcoded values.

UPDATE public.tenants
SET ui_config = jsonb_set(
  jsonb_set(
    ui_config,
    '{stats}',
    '[
      {"value": "500+", "label": "وحدة سكنية"},
      {"value": "98%", "label": "رضا العملاء"},
      {"value": "15+", "label": "سنة خبرة"},
      {"value": "3", "label": "مشاريع نشطة"}
    ]'::jsonb
  ),
  '{value_cards}',
  '[
    {"icon": "Building2", "title": "وحدات موثقة", "desc": "عروض محدثة مع تفاصيل واضحة لكل وحدة."},
    {"icon": "MapPin", "title": "حجز مباشر", "desc": "تصفح المتاح، احجز خطوتك التالية، وتابع حالة الطلب من لوحتك."},
    {"icon": "CreditCard", "title": "دفع آمن", "desc": "مدفوعات مرتبطة بحجزك عبر بوابة الدفع المعتمدة للمطور."},
    {"icon": "ShieldCheck", "title": "متابعة شفافة", "desc": "إشعارات وحالة الحجز والمستندات في مكان واحد."}
  ]'::jsonb
)
WHERE ui_config IS NOT NULL;
