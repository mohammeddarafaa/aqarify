ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS ui_config JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.tenants.ui_config IS
  'Per-tenant white-label UI config: branding, features, localization, and content overrides.';

UPDATE public.tenants
SET ui_config = jsonb_build_object(
  'version', 1,
  'branding', jsonb_build_object(
    'app_name', name,
    'tagline', 'Real Estate'
  ),
  'features', jsonb_build_object(
    'map_view', true,
    'waitlist', true,
    'leads_pipeline', true,
    'exports', true
  ),
  'localization', jsonb_build_object(
    'default_locale', COALESCE(default_locale, 'ar'),
    'supported_locales', jsonb_build_array('ar', 'en'),
    'rtl', true
  ),
  'content', jsonb_build_object(
    'hero_title', 'اكتشف مشاريعنا',
    'hero_subtitle', 'ثم وحداتك — احجز بخطوات واضحة',
    'hero_description', 'تصفح المشاريع، قارن الأسعار والمساحات، واحجز عبر بوابة المطور الرسمية.',
    'featured_title', 'مشاريع مميزة',
    'value_statement', 'أفضل طريقة لتجد وحدة تناسبك',
    'contact_title', 'دعنا نساعدك',
    'contact_description', 'فريقنا جاهز للإجابة على جميع استفساراتك ومساعدتك في اختيار وحدتك.',
    'cta_title', 'نساعدك على إتمام خطوة الحجز بثقة',
    'cta_description', 'ابدأ بتصفح المشاريع ثم الوحدات، أو تواصل مع فريق المبيعات.'
  )
)
WHERE slug = 'kdevelopments';
