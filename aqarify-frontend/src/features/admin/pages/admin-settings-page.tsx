import { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { toast } from "@/lib/app-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Settings, CreditCard, Users, ReceiptText, Palette, Globe, FileText, Upload,
} from "lucide-react";
import { useTenantStore } from "@/stores/tenant.store";

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: "general",      label: "عام",           icon: Settings },
  { id: "branding",     label: "الهوية البصرية", icon: Palette },
  { id: "content",      label: "المحتوى",       icon: FileText },
  { id: "localization", label: "اللغة والمنطقة", icon: Globe },
  { id: "paymob",       label: "مدفوعات",       icon: CreditCard },
  { id: "users",        label: "المستخدمون",    icon: Users },
  { id: "subscription", label: "الاشتراك",      icon: ReceiptText },
] as const;

// ─── Zod schemas ──────────────────────────────────────────────────────────────
const generalSchema = z.object({
  name:               z.string().min(2),
  contact_email:      z.string().email(),
  contact_phone:      z.string().optional(),
  address:            z.string().optional(),
  country_code:       z.string().max(8).optional(),
  currency:           z.string().max(8).optional(),
  custom_domain:      z.string().max(200).optional(),
  bank_name:          z.string().optional(),
  bank_account_number:z.string().optional(),
  bank_account_holder:z.string().optional(),
});

const brandingSchema = z.object({
  app_name:        z.string().min(1, "مطلوب"),
  tagline:         z.string().optional(),
  primary_color:   z.string().optional(),
  secondary_color: z.string().optional(),
  accent_color:    z.string().optional(),
  font_family:     z.string().optional(),
  radius_base:     z.string().optional(),
});

const contentSchema = z.object({
  hero_title:          z.string().optional(),
  hero_subtitle:       z.string().optional(),
  hero_description:    z.string().optional(),
  featured_title:      z.string().optional(),
  value_statement:     z.string().optional(),
  contact_title:       z.string().optional(),
  contact_description: z.string().optional(),
  cta_title:           z.string().optional(),
  cta_description:     z.string().optional(),
});

const localizationSchema = z.object({
  default_locale:    z.string().optional(),
  default_timezone:  z.string().optional(),
  fallback_currency: z.string().optional(),
});

const paymobSchema = z.object({
  api_key:        z.string().min(10, "مطلوب"),
  integration_id: z.string().min(1, "مطلوب"),
  iframe_id:      z.string().min(1, "مطلوب"),
  hmac_secret:    z.string().optional().refine(
    (s) => !s || s.length >= 8,
    { message: "HMAC يجب أن يكون 8 أحرف على الأقل أو اتركه فارغاً" },
  ),
});

type GeneralData = z.infer<typeof generalSchema>;
type BrandingData = z.infer<typeof brandingSchema>;
type ContentData  = z.infer<typeof contentSchema>;
type LocaleData   = z.infer<typeof localizationSchema>;
type PaymobData   = z.infer<typeof paymobSchema>;

type Plan    = { id: string; code: string; name: string; price_egp_monthly: number; price_egp_yearly: number };
type Invoice = { id: string; amount_egp: number; status: string; paid_at?: string | null; created_at: string };

// ─── Small helpers ────────────────────────────────────────────────────────────
function Field({ label, error, children, note }: {
  label: string; error?: string; children: React.ReactNode; note?: string;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ColorField({ label, register, name, form }: {
  label: string; register: ReturnType<typeof useForm>["register"]; name: string; form: ReturnType<typeof useForm>;
}) {
  const value = form.watch(name as string) ?? "#000000";
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => form.setValue(name as string, e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-lg border border-border bg-transparent p-1"
        />
        <Input {...register(name as string)} placeholder="#141414" />
      </div>
    </Field>
  );
}

// ─── Logo/Favicon uploader ───────────────────────────────────────────────────
function AssetUploader({
  label, note, currentUrl, onUpload,
}: { label: string; note?: string; currentUrl?: string | null; onUpload: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-4">
        {currentUrl ? (
          <img src={currentUrl} alt={label} className="h-14 w-14 rounded-lg border object-contain" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
            <Upload className="h-5 w-5" />
          </div>
        )}
        <div>
          <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
            <Upload className="me-2 h-4 w-4" /> {currentUrl ? "تغيير" : "رفع"}
          </Button>
          {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }}
      />
    </div>
  );
}

// ─── Feature toggles ─────────────────────────────────────────────────────────
const FEATURE_LABELS: Record<string, string> = {
  map_view:        "خريطة الوحدات",
  waitlist:        "قائمة الانتظار",
  leads_pipeline:  "إدارة العملاء المحتملين",
  exports:         "تصدير التقارير",
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const [tab, setTab] = useState<typeof TABS[number]["id"]>("general");
  const [selectedPlan, setSelectedPlan] = useState("");
  const qc = useQueryClient();
  const setTenant = useTenantStore((s) => s.setTenant);
  const currentTenant = useTenantStore((s) => s.tenant);

  // ─── Queries ──────────────────────────────────────────────────────────────
  const { data: tenant, isLoading } = useQuery({
    queryKey: ["admin-tenant"],
    queryFn: async () => { const r = await api.get("/admin/tenant"); return r.data.data; },
  });
  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => { const r = await api.get("/admin/users"); return r.data.data; },
    enabled: tab === "users",
  });
  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ["platform-plans"],
    queryFn: async () => (await api.get("/plans")).data.data,
    enabled: tab === "subscription",
  });
  const { data: subscription } = useQuery({
    queryKey: ["admin-subscription"],
    queryFn: async () => (await api.get("/subscription/me")).data.data,
    enabled: tab === "subscription",
  });
  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["admin-subscription-invoices"],
    queryFn: async () => (await api.get("/subscription/invoices")).data.data,
    enabled: tab === "subscription",
  });

  // ─── Forms ────────────────────────────────────────────────────────────────
  const ui = tenant?.tenant_ui_config ?? {};
  const thm = tenant?.theme_config ?? {};

  const generalForm = useForm<GeneralData>({
    resolver: zodResolver(generalSchema),
    values: tenant ? {
      name:               tenant.name ?? "",
      contact_email:      tenant.contact_email ?? "",
      contact_phone:      tenant.contact_phone ?? "",
      address:            tenant.address ?? "",
      country_code:       tenant.country_code ?? "",
      currency:           tenant.currency ?? "",
      custom_domain:      tenant.custom_domain ?? "",
      bank_name:          tenant.bank_name ?? "",
      bank_account_number:tenant.bank_account_number ?? "",
      bank_account_holder:tenant.bank_account_holder ?? "",
    } : undefined,
  });

  const brandingForm = useForm<BrandingData>({
    resolver: zodResolver(brandingSchema),
    values: tenant ? {
      app_name:        ui?.branding?.app_name        ?? tenant.name ?? "",
      tagline:         ui?.branding?.tagline          ?? "",
      primary_color:   thm?.primary_color             ?? "",
      secondary_color: thm?.secondary_color           ?? "",
      accent_color:    thm?.accent_color              ?? "",
      font_family:     thm?.font_family               ?? "",
      radius_base:     thm?.radius_base               ?? "16px",
    } : undefined,
  });

  const contentForm = useForm<ContentData>({
    resolver: zodResolver(contentSchema),
    values: tenant ? {
      hero_title:          ui?.content?.hero_title          ?? "",
      hero_subtitle:       ui?.content?.hero_subtitle       ?? "",
      hero_description:    ui?.content?.hero_description    ?? "",
      featured_title:      ui?.content?.featured_title      ?? "",
      value_statement:     ui?.content?.value_statement     ?? "",
      contact_title:       ui?.content?.contact_title       ?? "",
      contact_description: ui?.content?.contact_description ?? "",
      cta_title:           ui?.content?.cta_title           ?? "",
      cta_description:     ui?.content?.cta_description     ?? "",
    } : undefined,
  });

  const localeForm = useForm<LocaleData>({
    resolver: zodResolver(localizationSchema),
    values: tenant ? {
      default_locale:    tenant.default_locale    ?? "ar-EG",
      default_timezone:  tenant.default_timezone  ?? "Africa/Cairo",
      fallback_currency: tenant.fallback_currency ?? "EGP",
    } : undefined,
  });

  const paymobForm = useForm<PaymobData>({ resolver: zodResolver(paymobSchema) });

  // ─── Feature toggle state ─────────────────────────────────────────────────
  const defaultFeatures = { map_view: true, waitlist: true, leads_pipeline: true, exports: true };
  const [features, setFeatures] = useState<Record<string, boolean>>(
    tenant?.tenant_ui_config?.features ?? defaultFeatures,
  );
  // Update features when tenant loads
  if (tenant?.tenant_ui_config?.features && !Object.keys(features).some(Boolean)) {
    setFeatures(tenant.tenant_ui_config.features);
  }

  // ─── Mutations ────────────────────────────────────────────────────────────
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-tenant"] });
  };

  const saveGeneral = useMutation({
    mutationFn: async (d: GeneralData) => {
      const r = await api.patch("/admin/tenant", d);
      return r.data.data;
    },
    onSuccess: (data) => {
      if (data && currentTenant) setTenant({ ...currentTenant, ...data });
      invalidate();
      toast.success("تم حفظ الإعدادات العامة");
    },
    onError: () => toast.error("فشل الحفظ"),
  });

  const saveBranding = useMutation({
    mutationFn: async (d: BrandingData) => {
      const r = await api.patch("/admin/tenant", {
        theme_config: {
          primary_color:   d.primary_color,
          secondary_color: d.secondary_color,
          accent_color:    d.accent_color,
          font_family:     d.font_family,
          radius_base:     d.radius_base,
        },
        ui_config: {
          ...(tenant?.ui_config ?? {}),
          version:  1,
          branding: { app_name: d.app_name, tagline: d.tagline ?? "" },
        },
      });
      return r.data.data;
    },
    onSuccess: (data) => {
      if (data && currentTenant) setTenant({ ...currentTenant, ...data });
      invalidate();
      toast.success("تم حفظ الهوية البصرية");
    },
    onError: () => toast.error("فشل الحفظ"),
  });

  const saveContent = useMutation({
    mutationFn: async (d: ContentData) => {
      await api.patch("/admin/tenant", {
        ui_config: {
          ...(tenant?.ui_config ?? {}),
          version: 1,
          content: d,
        },
      });
    },
    onSuccess: () => { invalidate(); toast.success("تم حفظ المحتوى"); },
    onError: () => toast.error("فشل الحفظ"),
  });

  const saveLocale = useMutation({
    mutationFn: async (d: LocaleData) => {
      await api.patch("/admin/tenant", d);
    },
    onSuccess: () => { invalidate(); toast.success("تم حفظ إعدادات اللغة"); },
    onError: () => toast.error("فشل الحفظ"),
  });

  const saveFeatures = useMutation({
    mutationFn: async (feats: Record<string, boolean>) => {
      await api.patch("/admin/tenant", {
        ui_config: {
          ...(tenant?.ui_config ?? {}),
          version:  1,
          features: feats,
        },
      });
    },
    onSuccess: () => { invalidate(); toast.success("تم حفظ الميزات"); },
    onError: () => toast.error("فشل الحفظ"),
  });

  const savePaymob = useMutation({
    mutationFn: async (d: PaymobData) => {
      await api.patch("/admin/tenant/paymob", {
        api_key:        d.api_key,
        integration_id: d.integration_id,
        iframe_id:      d.iframe_id,
        ...(d.hmac_secret?.trim() ? { hmac_secret: d.hmac_secret.trim() } : {}),
      });
    },
    onSuccess: () => toast.success("تم حفظ بيانات بوابة الدفع"),
    onError: () => toast.error("فشل الحفظ"),
  });

  const uploadAsset = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: "logo" | "favicon" }) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", type);
      const r = await api.post("/admin/tenant/assets", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return r.data.data as { url: string };
    },
    onSuccess: (data, variables) => {
      if (currentTenant) {
        setTenant({
          ...currentTenant,
          ...(variables.type === "logo" ? { logo_url: data.url } : { favicon_url: data.url }),
        });
      }
      invalidate();
      toast.success(variables.type === "logo" ? "تم رفع الشعار" : "تم رفع الـ Favicon");
    },
    onError: () => toast.error("فشل الرفع"),
  });

  const changeRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) =>
      api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("تم تغيير الدور"); },
  });

  const renewSubscription = useMutation({
    mutationFn: async () => (await api.post("/subscription/renew")).data.data as { iframeUrl: string },
    onSuccess: (d) => {
      if (d.iframeUrl) window.location.href = d.iframeUrl;
      else toast.success("تم بدء التجديد");
    },
    onError: () => toast.error("فشل التجديد"),
  });

  const cancelSubscription = useMutation({
    mutationFn: async () => api.post("/subscription/cancel"),
    onSuccess: () => {
      toast.success("تم جدولة الإلغاء بنهاية الفترة");
      qc.invalidateQueries({ queryKey: ["admin-subscription"] });
    },
    onError: () => toast.error("فشل الإلغاء"),
  });

  const changePlan = useMutation({
    mutationFn: async () => {
      if (!selectedPlan) return;
      await api.post("/subscription/change-plan", { plan_code: selectedPlan });
    },
    onSuccess: () => {
      toast.success("تم تحديث الخطة");
      setSelectedPlan("");
      qc.invalidateQueries({ queryKey: ["admin-subscription"] });
    },
    onError: () => toast.error("فشل تحديث الخطة"),
  });

  // ─── Subscription helpers ─────────────────────────────────────────────────
  const periodEnd = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;
  const daysRemaining = periodEnd
    ? Math.max(0, Math.ceil((periodEnd.getTime() - Date.now()) / 86400000))
    : 0;
  const periodLength = subscription?.billing_cycle === "yearly" ? 365 : 30;
  const progressValue = periodEnd
    ? Math.min(100, Math.max(0, (daysRemaining / periodLength) * 100))
    : 0;

  // ─── Color preview ────────────────────────────────────────────────────────
  const previewPrimary   = brandingForm.watch("primary_color")   ?? "#141414";
  const previewAccent    = brandingForm.watch("accent_color")    ?? "#C8FF00";
  const previewAppName   = brandingForm.watch("app_name")        ?? tenant?.name ?? "Portal";
  const previewTagline   = brandingForm.watch("tagline")         ?? "";

  // ─── Render ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <>
      <Helmet><title>إعدادات المنصة</title></Helmet>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">إعدادات المنصة</h1>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mb-8">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-muted/60 p-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <TabsTrigger key={id} value={id} className="gap-2 rounded-xl py-2">
                <Icon className="h-4 w-4" />{label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* ── General ──────────────────────────────────────────────────── */}
        {tab === "general" && (
          <form onSubmit={generalForm.handleSubmit((d) => saveGeneral.mutate(d))} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="اسم الشركة" error={generalForm.formState.errors.name?.message} className="col-span-2">
                <Input {...generalForm.register("name")} />
              </Field>
              <Field label="البريد الإلكتروني" error={generalForm.formState.errors.contact_email?.message}>
                <Input type="email" {...generalForm.register("contact_email")} />
              </Field>
              <Field label="الهاتف">
                <Input {...generalForm.register("contact_phone")} />
              </Field>
              <Field label="العنوان" className="col-span-2">
                <Input {...generalForm.register("address")} />
              </Field>
              <Field label="رمز الدولة">
                <Input {...generalForm.register("country_code")} placeholder="EG" dir="ltr" />
              </Field>
              <Field label="العملة">
                <Input {...generalForm.register("currency")} placeholder="EGP" dir="ltr" />
              </Field>
              <Field
                label="نطاق مخصص"
                note="أحرف صغيرة وأرقام وشرطة فقط؛ اتركه فارغاً لإزالة الربط."
                className="col-span-2"
              >
                <Input {...generalForm.register("custom_domain")} placeholder="app.example.com" dir="ltr" className="font-mono text-sm" />
              </Field>

              <div className="col-span-2 rounded-xl border bg-muted/30 p-4 space-y-4">
                <p className="text-sm font-medium">التحويل البنكي للعملاء</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="اسم البنك" className="col-span-2 sm:col-span-1">
                    <Input {...generalForm.register("bank_name")} placeholder="البنك الأهلي..." />
                  </Field>
                  <Field label="رقم الحساب / IBAN" className="col-span-2 sm:col-span-1">
                    <Input {...generalForm.register("bank_account_number")} dir="ltr" />
                  </Field>
                  <Field label="اسم صاحب الحساب" className="col-span-2">
                    <Input {...generalForm.register("bank_account_holder")} />
                  </Field>
                </div>
              </div>
            </div>
            <Button type="submit" disabled={saveGeneral.isPending}>حفظ الإعدادات العامة</Button>
          </form>
        )}

        {/* ── Branding ─────────────────────────────────────────────────── */}
        {tab === "branding" && (
          <div className="space-y-8">
            {/* Assets */}
            <div className="rounded-xl border bg-card p-5 space-y-5">
              <p className="font-semibold">الأصول المرئية</p>
              <AssetUploader
                label="شعار الشركة"
                note="PNG أو SVG شفاف، يُفضَّل 200×200 بكسل"
                currentUrl={tenant?.logo_url}
                onUpload={(f) => uploadAsset.mutate({ file: f, type: "logo" })}
              />
              <AssetUploader
                label="Favicon"
                note="PNG مربع 32×32 أو 64×64 بكسل"
                currentUrl={tenant?.favicon_url}
                onUpload={(f) => uploadAsset.mutate({ file: f, type: "favicon" })}
              />
            </div>

            {/* Branding form */}
            <form onSubmit={brandingForm.handleSubmit((d) => saveBranding.mutate(d))} className="space-y-5">
              <div className="rounded-xl border bg-card p-5 space-y-4">
                <p className="font-semibold">الاسم والشعار النصي</p>
                <Field label="اسم التطبيق / البوابة" error={brandingForm.formState.errors.app_name?.message}>
                  <Input {...brandingForm.register("app_name")} />
                </Field>
                <Field label="الشعار التجاري (Tagline)" note="يظهر تحت الاسم في الشريط الجانبي">
                  <Input {...brandingForm.register("tagline")} placeholder="ابدأ رحلة الحجز بثقة" />
                </Field>
              </div>

              <div className="rounded-xl border bg-card p-5 space-y-4">
                <p className="font-semibold">الألوان</p>
                <div className="grid grid-cols-2 gap-4">
                  <ColorField label="اللون الرئيسي"  register={brandingForm.register} name="primary_color"   form={brandingForm as ReturnType<typeof useForm>} />
                  <ColorField label="اللون الثانوي" register={brandingForm.register} name="secondary_color" form={brandingForm as ReturnType<typeof useForm>} />
                  <ColorField label="لون التأكيد"   register={brandingForm.register} name="accent_color"    form={brandingForm as ReturnType<typeof useForm>} />
                </div>
              </div>

              <div className="rounded-xl border bg-card p-5 space-y-4">
                <p className="font-semibold">الخط والتخطيط</p>
                <Field label="خط الواجهة" note="أي خط Google Fonts، مثال: Cairo أو Tajawal">
                  <Input {...brandingForm.register("font_family")} placeholder="Cairo" dir="ltr" />
                </Field>
                <Field label="نصف قطر الزوايا (radius)" note="مثال: 16px لزوايا ناعمة، 4px لتصميم حاد">
                  <Input {...brandingForm.register("radius_base")} placeholder="16px" dir="ltr" />
                </Field>
              </div>

              {/* Live preview */}
              <div className="rounded-xl border bg-muted/30 p-5 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">معاينة مباشرة</p>
                <div
                  className="flex items-center gap-3 rounded-lg p-3"
                  style={{ background: previewPrimary, color: "#fff" }}
                >
                  <div
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold"
                    style={{ background: previewAccent, color: previewPrimary }}
                  >
                    {previewAppName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{previewAppName}</p>
                    {previewTagline && <p className="text-xs opacity-70">{previewTagline}</p>}
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={saveBranding.isPending}>حفظ الهوية البصرية</Button>
            </form>
          </div>
        )}

        {/* ── Content ──────────────────────────────────────────────────── */}
        {tab === "content" && (
          <form onSubmit={contentForm.handleSubmit((d) => saveContent.mutate(d))} className="space-y-5">
            <p className="text-sm text-muted-foreground rounded-lg bg-muted/40 p-3">
              النصوص التالية تظهر في صفحات العملاء العامة (الصفحة الرئيسية، صفحة المشاريع). اتركها فارغة لتُستخدم القيم الافتراضية.
            </p>
            <div className="grid gap-4">
              <Field label="عنوان البانر الرئيسي">
                <Input {...contentForm.register("hero_title")} placeholder="اكتشف وحدتك المثالية" />
              </Field>
              <Field label="عنوان فرعي للبانر">
                <Input {...contentForm.register("hero_subtitle")} placeholder="احجز بخطوات واضحة" />
              </Field>
              <Field label="وصف البانر">
                <Textarea {...contentForm.register("hero_description")} rows={2} placeholder="تصفّح المشاريع وقارن الأسعار..." />
              </Field>
              <Field label="عنوان المشاريع المميزة">
                <Input {...contentForm.register("featured_title")} placeholder="مشاريع مميزة" />
              </Field>
              <Field label="جملة القيمة">
                <Input {...contentForm.register("value_statement")} placeholder="أفضل طريقة لتجد وحدة تناسبك" />
              </Field>
              <Field label="عنوان قسم التواصل">
                <Input {...contentForm.register("contact_title")} placeholder="دعنا نساعدك" />
              </Field>
              <Field label="وصف قسم التواصل">
                <Textarea {...contentForm.register("contact_description")} rows={2} placeholder="فريقنا جاهز للإجابة..." />
              </Field>
              <Field label="عنوان زر الدعوة للعمل (CTA)">
                <Input {...contentForm.register("cta_title")} placeholder="نساعدك على إتمام خطوة الحجز بثقة" />
              </Field>
              <Field label="وصف الـ CTA">
                <Textarea {...contentForm.register("cta_description")} rows={2} placeholder="ابدأ بتصفّح المشاريع..." />
              </Field>
            </div>
            <Button type="submit" disabled={saveContent.isPending}>حفظ المحتوى</Button>
          </form>
        )}

        {/* ── Localization ─────────────────────────────────────────────── */}
        {tab === "localization" && (
          <div className="space-y-6">
            <form onSubmit={localeForm.handleSubmit((d) => saveLocale.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="اللغة الافتراضية">
                  <Input {...localeForm.register("default_locale")} placeholder="ar-EG" dir="ltr" />
                </Field>
                <Field label="المنطقة الزمنية">
                  <Input {...localeForm.register("default_timezone")} placeholder="Africa/Cairo" dir="ltr" />
                </Field>
                <Field label="عملة احتياطية">
                  <Input {...localeForm.register("fallback_currency")} placeholder="EGP" dir="ltr" />
                </Field>
              </div>
              <Button type="submit" disabled={saveLocale.isPending}>حفظ الإعدادات</Button>
            </form>

            {/* Feature flags */}
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <p className="font-semibold">الميزات المفعّلة</p>
              {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={`feat-${key}`}>{label}</Label>
                  <Switch
                    id={`feat-${key}`}
                    checked={features[key] ?? true}
                    onCheckedChange={(checked) => setFeatures((f) => ({ ...f, [key]: checked }))}
                  />
                </div>
              ))}
              <Button
                type="button"
                onClick={() => saveFeatures.mutate(features)}
                disabled={saveFeatures.isPending}
              >
                حفظ الميزات
              </Button>
            </div>
          </div>
        )}

        {/* ── Paymob ───────────────────────────────────────────────────── */}
        {tab === "paymob" && (
          <form onSubmit={paymobForm.handleSubmit((d) => savePaymob.mutate(d))} className="space-y-4">
            <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              بيانات بوابة الدفع Paymob — تُخزَّن مشفّرة ولا تظهر مجدداً بعد الحفظ.
            </p>
            <Field label="API Key" error={paymobForm.formState.errors.api_key?.message}>
              <Input type="password" {...paymobForm.register("api_key")} placeholder="ZXhh..." />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Integration ID" error={paymobForm.formState.errors.integration_id?.message}>
                <Input {...paymobForm.register("integration_id")} placeholder="123456" />
              </Field>
              <Field label="iFrame ID" error={paymobForm.formState.errors.iframe_id?.message}>
                <Input {...paymobForm.register("iframe_id")} placeholder="12345" />
              </Field>
            </div>
            <Field
              label="Paymob HMAC"
              note="يُخزَّن مشفّراً. مطلوب للتحقق من إشعارات الدفع."
              error={paymobForm.formState.errors.hmac_secret?.message}
            >
              <Input type="password" {...paymobForm.register("hmac_secret")} placeholder="اتركه فارغاً إن لم تغيّره" />
            </Field>
            <Button type="submit" disabled={savePaymob.isPending}>حفظ بيانات الدفع</Button>
          </form>
        )}

        {/* ── Users ────────────────────────────────────────────────────── */}
        {tab === "users" && (
          <div className="space-y-3">
            {!(users?.items?.length) && !isLoading && <EmptyState title="لا يوجد مستخدمون حتى الآن" />}
            {(users?.items ?? []).map((u: { id: string; full_name: string; email: string; role: string; is_active: boolean }) => (
              <div key={u.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
                <div>
                  <p className="font-medium">{u.full_name}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  {!u.is_active && <Badge variant="outline">معطّل</Badge>}
                  <select
                    value={u.role}
                    onChange={(e) => changeRole.mutate({ id: u.id, role: e.target.value })}
                    className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                  >
                    {["customer", "agent", "manager", "admin"].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Subscription ─────────────────────────────────────────────── */}
        {tab === "subscription" && (
          <div className="space-y-5">
            {subscription ? (
              <>
                <div className="rounded-xl border bg-card p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">الخطة الحالية</p>
                      <p className="text-xl font-semibold">{subscription.plan?.name ?? "—"}</p>
                    </div>
                    <Badge variant={subscription.status === "active" ? "default" : "destructive"}>
                      {subscription.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {periodEnd
                      ? `ينتهي في ${periodEnd.toLocaleDateString("ar-EG")} — متبقي ${daysRemaining} يوم`
                      : "لم يُعيَّن تاريخ انتهاء"}
                  </p>
                  <Progress value={progressValue} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => renewSubscription.mutate()} disabled={renewSubscription.isPending}>
                      تجديد الآن
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={cancelSubscription.isPending}
                      onClick={() => {
                        if (window.confirm("تأكيد إلغاء الاشتراك بنهاية الفترة؟")) cancelSubscription.mutate();
                      }}
                    >
                      إلغاء الاشتراك
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border bg-card p-5 space-y-4">
                  <p className="font-semibold">تغيير الخطة</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlan(plan.code)}
                        className={`rounded-xl border p-4 text-start transition-colors ${
                          selectedPlan === plan.code
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <p className="font-semibold">{plan.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatCurrency(plan.price_egp_monthly, "EGP", "ar")} / شهرياً
                        </p>
                      </button>
                    ))}
                  </div>
                  <Button
                    onClick={() => changePlan.mutate()}
                    disabled={!selectedPlan || changePlan.isPending}
                  >
                    تطبيق الخطة المختارة
                  </Button>
                </div>

                {/* Invoice history */}
                <div className="rounded-xl border bg-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-right">التاريخ</th>
                        <th className="px-4 py-3 text-right">الحالة</th>
                        <th className="px-4 py-3 text-right">المبلغ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {invoices.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                            لا توجد فواتير بعد
                          </td>
                        </tr>
                      )}
                      {invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(inv.paid_at ?? inv.created_at).toLocaleDateString("ar-EG")}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={inv.status === "succeeded" ? "default" : "outline"}>
                              {inv.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {formatCurrency(inv.amount_egp, "EGP", "ar")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <EmptyState title="لا يوجد اشتراك مرتبط حتى الآن" />
            )}
          </div>
        )}
      </div>
    </>
  );
}
