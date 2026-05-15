import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { api } from "@/lib/api";
import { toast } from "@/lib/app-toast";
import { appendTenantSearch } from "@/lib/tenant-path";
import { useTenantStore } from "@/stores/tenant.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const STEPS = ["company", "branding", "payments", "project", "units", "launch"] as const;
type Step = (typeof STEPS)[number];

function isStep(s: string | undefined): s is Step {
  return !!s && (STEPS as readonly string[]).includes(s);
}

export default function OnboardingWizardPage() {
  const { step: stepParam } = useParams<{ step: string }>();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const qc = useQueryClient();
  const slug = useTenantStore((s) => s.tenant?.slug);
  const withTenant = (p: string) => appendTenantSearch(pathname, search, p);

  const step: Step = isStep(stepParam) ? stepParam : "company";

  const { data: onboard } = useQuery({
    queryKey: ["admin-onboarding"],
    queryFn: async () => (await api.get("/admin/onboarding")).data.data as {
      onboarding_completed_at: string | null;
      counts: { projects: number; units: number };
      country_code?: string;
      paymob_integration_id?: string | null;
    },
  });

  const [companyForm, setCompanyForm] = useState({
    name: "",
    country_code: "EG",
    currency: "EGP",
    fallback_currency: "EGP",
  });
  const [brandForm, setBrandForm] = useState({ primary_color: "#141414", secondary_color: "#a3e635" });
  const [paymobForm, setPaymobForm] = useState({
    api_key: "",
    integration_id: "",
    iframe_id: "",
    hmac_secret: "",
  });
  const [skipOnline, setSkipOnline] = useState(false);
  const [warnPaymob, setWarnPaymob] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: "", address: "" });
  const [unitForm, setUnitForm] = useState({
    project_id: "",
    unit_number: "A-101",
    type: "apartment",
    size_sqm: 120,
    price: 5_000_000,
    reservation_fee: 50_000,
  });

  const { data: tenant } = useQuery({
    queryKey: ["admin-tenant"],
    queryFn: async () => (await api.get("/admin/tenant")).data.data as Record<string, unknown>,
  });

  useEffect(() => {
    if (!tenant) return;
    setCompanyForm((f) => ({
      ...f,
      name: String(tenant.name ?? f.name),
      country_code: String(tenant.country_code ?? f.country_code),
      currency: String(tenant.currency ?? f.currency),
      fallback_currency: String(tenant.fallback_currency ?? f.fallback_currency),
    }));
    const tc = tenant.theme_config as { primary_color?: string; secondary_color?: string } | undefined;
    if (tc?.primary_color) setBrandForm({ primary_color: tc.primary_color, secondary_color: tc.secondary_color ?? "#a3e635" });
  }, [tenant]);

  const { data: projects = [] } = useQuery({
    queryKey: ["manager-projects-onboarding"],
    queryFn: async () => (await api.get("/manager/projects")).data.data as { id: string; name: string }[],
    enabled: step === "units" || step === "project",
  });

  useEffect(() => {
    if (projects.length && !unitForm.project_id) {
      setUnitForm((u) => ({ ...u, project_id: projects[0]!.id }));
    }
  }, [projects, unitForm.project_id]);

  const idx = STEPS.indexOf(step);

  const mergeProgress = useMutation({
    mutationFn: async (merge: Record<string, Record<string, unknown>>) => {
      await api.patch("/admin/onboarding/progress", { merge });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-onboarding"] });
    },
  });

  const saveCompany = useMutation({
    mutationFn: async () => {
      await api.patch("/admin/tenant", {
        name: companyForm.name,
        country_code: companyForm.country_code,
        currency: companyForm.currency,
        fallback_currency: companyForm.fallback_currency,
      });
      await mergeProgress.mutateAsync({ company: { saved_at: new Date().toISOString() } });
    },
    onSuccess: () => {
      toast.success("تم حفظ بيانات الشركة");
      qc.invalidateQueries({ queryKey: ["admin-tenant"] });
    },
    onError: () => toast.error("تعذّر الحفظ"),
  });

  const saveBranding = useMutation({
    mutationFn: async () => {
      await api.patch("/admin/tenant", {
        primary_color: brandForm.primary_color,
        secondary_color: brandForm.secondary_color,
      });
      await mergeProgress.mutateAsync({ branding: { saved_at: new Date().toISOString() } });
    },
    onSuccess: () => {
      toast.success("تم حفظ الهوية");
      qc.invalidateQueries({ queryKey: ["admin-tenant"] });
    },
    onError: () => toast.error("تعذّر الحفظ"),
  });

  const savePayments = useMutation({
    mutationFn: async () => {
      if (skipOnline) {
        await mergeProgress.mutateAsync({ payments: { skipped_online: true, saved_at: new Date().toISOString() } });
        return;
      }
      if (!paymobForm.api_key || !paymobForm.integration_id || !paymobForm.iframe_id) {
        setWarnPaymob(true);
        throw new Error("missing paymob");
      }
      await api.patch("/admin/tenant/paymob", {
        api_key: paymobForm.api_key,
        integration_id: paymobForm.integration_id,
        iframe_id: paymobForm.iframe_id,
        ...(paymobForm.hmac_secret.trim() ? { hmac_secret: paymobForm.hmac_secret.trim() } : {}),
      });
      await mergeProgress.mutateAsync({
        payments: { skipped_online: false, saved_at: new Date().toISOString(), validated: true },
      });
    },
    onSuccess: () => {
      setWarnPaymob(false);
      toast.success(skipOnline ? "تم تخطي الدفع الإلكتروني مؤقتاً" : "تم حفظ Paymob");
      qc.invalidateQueries({ queryKey: ["admin-tenant"] });
      qc.invalidateQueries({ queryKey: ["admin-onboarding"] });
    },
    onError: (e) => {
      if ((e as Error).message !== "missing paymob") toast.error("تعذّر الحفظ");
    },
  });

  const createProject = useMutation({
    mutationFn: async () => {
      const r = await api.post("/projects", {
        name: projectForm.name,
        address: projectForm.address || undefined,
      });
      await api.patch("/admin/onboarding/progress", {
        merge: {
          project: { project_id: r.data.data.id as string, saved_at: new Date().toISOString() },
        },
      });
      return r.data.data;
    },
    onSuccess: () => {
      toast.success("تم إنشاء المشروع");
      qc.invalidateQueries({ queryKey: ["manager-projects-onboarding"] });
      qc.invalidateQueries({ queryKey: ["admin-onboarding"] });
    },
    onError: () => toast.error("تعذّر إنشاء المشروع"),
  });

  const createUnit = useMutation({
    mutationFn: async () => {
      await api.post("/manager/units", {
        project_id: unitForm.project_id,
        unit_number: unitForm.unit_number,
        type: unitForm.type,
        size_sqm: unitForm.size_sqm,
        price: unitForm.price,
        reservation_fee: unitForm.reservation_fee,
      });
      await api.patch("/admin/onboarding/progress", {
        merge: { units: { saved_at: new Date().toISOString() } },
      });
    },
    onSuccess: () => {
      toast.success("تمت إضافة وحدة");
      qc.invalidateQueries({ queryKey: ["admin-onboarding"] });
    },
    onError: () => toast.error("تعذّر إضافة الوحدة"),
  });

  const completeOnboarding = useMutation({
    mutationFn: async () => {
      await api.post("/admin/onboarding/complete");
    },
    onSuccess: () => {
      toast.success("اكتمل الإعداد — مرحباً بك!");
      qc.invalidateQueries({ queryKey: ["admin-tenant"] });
      qc.invalidateQueries({ queryKey: ["admin-onboarding"] });
      navigate(withTenant("/admin/overview"), { replace: true });
    },
    onError: (err: unknown) => {
      const msg =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : null;
      toast.error(msg ?? "أكمل المتطلبات السابقة أولاً");
    },
  });

  const browsePreview = useMemo(() => {
    if (!slug) return "/browse";
    const onApex =
      typeof window !== "undefined" &&
      ["localhost", "127.0.0.1", "0.0.0.0"].includes(window.location.hostname);
    return onApex ? `/t/${encodeURIComponent(slug)}/browse` : `/browse?tenant=${encodeURIComponent(slug)}`;
  }, [slug]);

  if (!isStep(stepParam)) {
    return <Navigate to={withTenant("/admin/onboarding/company")} replace />;
  }

  if (onboard?.onboarding_completed_at) {
    return <Navigate to={withTenant("/admin/overview")} replace />;
  }

  return (
    <>
      <Helmet>
        <title>إعداد المنصة</title>
      </Helmet>
      <div className="mx-auto max-w-2xl space-y-8 px-4 py-10">
        <div>
          <p className="text-sm font-medium text-muted-foreground">خطوة {idx + 1} من {STEPS.length}</p>
          <h1 className="text-2xl font-bold tracking-tight">إعداد المنصة لأول مرة</h1>
        </div>

        <nav className="flex flex-wrap gap-2">
          {STEPS.map((s) => (
            <Link
              key={s}
              to={withTenant(`/admin/onboarding/${s}`)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium ring-1 ring-border transition-colors",
                s === step ? "bg-foreground text-background" : "bg-muted/50 text-muted-foreground hover:bg-muted",
              )}
            >
              {s}
            </Link>
          ))}
        </nav>

        {step === "company" && (
          <Card>
            <CardHeader>
              <CardTitle>الشركة والعملة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>اسم الشركة</Label>
                <Input value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>رمز الدولة</Label>
                  <Input
                    value={companyForm.country_code}
                    onChange={(e) => setCompanyForm({ ...companyForm, country_code: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>العملة</Label>
                  <Input
                    value={companyForm.fallback_currency}
                    onChange={(e) =>
                      setCompanyForm({ ...companyForm, fallback_currency: e.target.value.toUpperCase(), currency: e.target.value.toUpperCase() })
                    }
                  />
                </div>
              </div>
              <Button type="button" onClick={() => saveCompany.mutate()} disabled={saveCompany.isPending}>
                حفظ ومتابعة
              </Button>
              <Button variant="ghost" className="ms-2" asChild>
                <Link to={withTenant("/admin/onboarding/branding")}>التالي ←</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "branding" && (
          <Card>
            <CardHeader>
              <CardTitle>الألوان الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>أساسي</Label>
                  <Input type="color" value={brandForm.primary_color} onChange={(e) => setBrandForm({ ...brandForm, primary_color: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>ثانوي</Label>
                  <Input
                    type="color"
                    value={brandForm.secondary_color}
                    onChange={(e) => setBrandForm({ ...brandForm, secondary_color: e.target.value })}
                  />
                </div>
              </div>
              <Button type="button" onClick={() => saveBranding.mutate()} disabled={saveBranding.isPending}>
                حفظ
              </Button>
              <Button variant="ghost" asChild>
                <Link to={withTenant("/admin/onboarding/payments")}>التالي ←</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "payments" && (
          <Card>
            <CardHeader>
              <CardTitle>بوابة الدفع (Paymob)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={skipOnline} onCheckedChange={(v) => setSkipOnline(Boolean(v))} />
                تخطي الدفع بالبطاقة الآن (تحصيل بنكي فقط لاحقاً)
              </label>
              {warnPaymob && (
                <Alert variant="destructive">
                  <AlertDescription>أدخل مفاتيح Paymob كاملة أو فعّل التخطي.</AlertDescription>
                </Alert>
              )}
              {!skipOnline && (
                <>
                  <div className="space-y-1">
                    <Label>API Key</Label>
                    <Input type="password" value={paymobForm.api_key} onChange={(e) => setPaymobForm({ ...paymobForm, api_key: e.target.value })} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Integration ID</Label>
                      <Input
                        value={paymobForm.integration_id}
                        onChange={(e) => setPaymobForm({ ...paymobForm, integration_id: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>iFrame ID</Label>
                      <Input value={paymobForm.iframe_id} onChange={(e) => setPaymobForm({ ...paymobForm, iframe_id: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>HMAC (اختياري)</Label>
                    <Input
                      type="password"
                      value={paymobForm.hmac_secret}
                      onChange={(e) => setPaymobForm({ ...paymobForm, hmac_secret: e.target.value })}
                    />
                  </div>
                </>
              )}
              <Button type="button" onClick={() => savePayments.mutate()} disabled={savePayments.isPending}>
                حفظ
              </Button>
              <Button variant="ghost" asChild>
                <Link to={withTenant("/admin/onboarding/project")}>التالي ←</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "project" && (
          <Card>
            <CardHeader>
              <CardTitle>أول مشروع</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>اسم المشروع</Label>
                <Input value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>العنوان</Label>
                <Input value={projectForm.address} onChange={(e) => setProjectForm({ ...projectForm, address: e.target.value })} />
              </div>
              <Button type="button" onClick={() => createProject.mutate()} disabled={createProject.isPending || projectForm.name.length < 2}>
                إنشاء مشروع
              </Button>
              <Button variant="ghost" asChild>
                <Link to={withTenant("/admin/onboarding/units")}>التالي ←</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "units" && (
          <Card>
            <CardHeader>
              <CardTitle>أول وحدة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {projects.length === 0 ? (
                <Alert>
                  <AlertDescription>أنشئ مشروعاً في الخطوة السابقة أولاً.</AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="space-y-1">
                    <Label>المشروع</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={unitForm.project_id}
                      onChange={(e) => setUnitForm({ ...unitForm, project_id: e.target.value })}
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label>رقم الوحدة</Label>
                      <Input value={unitForm.unit_number} onChange={(e) => setUnitForm({ ...unitForm, unit_number: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>النوع</Label>
                      <Input value={unitForm.type} onChange={(e) => setUnitForm({ ...unitForm, type: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>المساحة (م²)</Label>
                      <Input
                        type="number"
                        value={unitForm.size_sqm}
                        onChange={(e) => setUnitForm({ ...unitForm, size_sqm: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>السعر</Label>
                      <Input type="number" value={unitForm.price} onChange={(e) => setUnitForm({ ...unitForm, price: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-1">
                      <Label>رسوم الحجز</Label>
                      <Input
                        type="number"
                        value={unitForm.reservation_fee}
                        onChange={(e) => setUnitForm({ ...unitForm, reservation_fee: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <Button type="button" onClick={() => createUnit.mutate()} disabled={createUnit.isPending || !unitForm.project_id}>
                    إضافة وحدة
                  </Button>
                </>
              )}
              <Button variant="ghost" asChild>
                <Link to={withTenant("/admin/onboarding/launch")}>التالي ←</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "launch" && (
          <Card>
            <CardHeader>
              <CardTitle>معاينة وإطلاق</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                المشاريع: {onboard?.counts.projects ?? 0} — الوحدات: {onboard?.counts.units ?? 0}
              </p>
              <Button variant="outline" asChild>
                <a href={browsePreview} target="_blank" rel="noreferrer">
                  فتح الموقع العام في تاب جديد
                </a>
              </Button>
              <div>
                <Button type="button" onClick={() => completeOnboarding.mutate()} disabled={completeOnboarding.isPending}>
                  إنهاء الإعداد والذهاب للوحة التحكم
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
