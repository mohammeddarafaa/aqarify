import { z } from "zod";

const tenantBrandingSchema = z.object({
  app_name: z.string().min(1),
  tagline: z.string().default(""),
});

const tenantFeaturesSchema = z.object({
  map_view: z.boolean().default(true),
  waitlist: z.boolean().default(true),
  leads_pipeline: z.boolean().default(true),
  exports: z.boolean().default(true),
});

const tenantLocalizationSchema = z.object({
  default_locale: z.string().default("ar"),
  supported_locales: z.array(z.string()).default(["ar", "en"]),
  rtl: z.boolean().default(true),
});

const tenantContentSchema = z.object({
  hero_title: z.string().default("اكتشف مشاريعنا"),
  hero_subtitle: z.string().default("ثم وحداتك — احجز بخطوات واضحة"),
  hero_description: z
    .string()
    .default("تصفّح المشاريع، قارن الأسعار والمساحات، واحجز عبر منصة موثوقة."),
  featured_title: z.string().default("مشاريع مميزة"),
  value_statement: z.string().default("أفضل طريقة لتجد وحدة تناسبك"),
  contact_title: z.string().default("دعنا نساعدك"),
  contact_description: z
    .string()
    .default("فريقنا جاهز للإجابة على جميع استفساراتك ومساعدتك في اختيار وحدتك."),
  cta_title: z.string().default("نساعدك على إتمام خطوة الحجز بثقة"),
  cta_description: z
    .string()
    .default("ابدأ بتصفّح المشاريع ثم الوحدات، أو تواصل مع فريق المبيعات."),
});

const tenantUiConfigSchema = z.object({
  version: z.literal(1).default(1),
  branding: tenantBrandingSchema,
  features: tenantFeaturesSchema.default({}),
  localization: tenantLocalizationSchema.default({}),
  content: tenantContentSchema.default({}),
});

export type TenantUiConfig = z.infer<typeof tenantUiConfigSchema>;

type TenantLike = {
  name?: string | null;
  default_locale?: string;
  ui_config?: unknown;
};

export function resolveTenantUiConfig(tenant: TenantLike): TenantUiConfig {
  const fallback = {
    version: 1,
    branding: { app_name: tenant.name?.trim() || "Portal", tagline: "" },
    features: { map_view: true, waitlist: true, leads_pipeline: true, exports: true },
    localization: {
      default_locale: tenant.default_locale || "ar",
      supported_locales: ["ar", "en"],
      rtl: (tenant.default_locale || "ar").startsWith("ar"),
    },
    content: {},
  };

  const candidate =
    tenant.ui_config && typeof tenant.ui_config === "object"
      ? { ...fallback, ...tenant.ui_config }
      : fallback;

  const parsed = tenantUiConfigSchema.safeParse(candidate);
  return parsed.success ? parsed.data : fallback;
}
