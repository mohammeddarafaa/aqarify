import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { toast } from "@/lib/app-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Settings, CreditCard, Users, ReceiptText } from "lucide-react";

const TABS = [
  { id: "general", label: "عام", icon: Settings },
  { id: "paymob", label: "مدفوعات العملاء", icon: CreditCard },
  { id: "users", label: "المستخدمون", icon: Users },
  { id: "subscription", label: "الاشتراك", icon: ReceiptText },
] as const;

const tenantSchema = z.object({
  name: z.string().min(2), contact_email: z.string().email(),
  contact_phone: z.string().optional(), primary_color: z.string().optional(),
  secondary_color: z.string().optional(), address: z.string().optional(),
});

const paymobSchema = z.object({
  api_key: z.string().min(10, "مطلوب"),
  integration_id: z.string().min(1, "مطلوب"),
  iframe_id: z.string().optional(),
});

type TenantData = z.infer<typeof tenantSchema>;
type PaymobData = z.infer<typeof paymobSchema>;
type Plan = { id: string; code: "starter" | "growth" | "pro"; name: string; price_egp_monthly: number; price_egp_yearly: number };
type Invoice = { id: string; amount_egp: number; status: string; paid_at?: string | null; created_at: string };

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<"general" | "paymob" | "users" | "subscription">("general");
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "growth" | "pro" | "">("");
  const qc = useQueryClient();

  const { data: tenant } = useQuery({
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
    queryFn: async () => {
      const r = await api.get("/plans");
      return r.data.data;
    },
    enabled: tab === "subscription",
  });
  const { data: subscription } = useQuery({
    queryKey: ["admin-subscription"],
    queryFn: async () => {
      const r = await api.get("/subscription/me");
      return r.data.data as {
        id: string;
        status: string;
        billing_cycle: "monthly" | "yearly";
        amount_egp: number;
        current_period_start?: string | null;
        current_period_end?: string | null;
        cancel_at_period_end?: boolean;
        plan?: Plan;
      } | null;
    },
    enabled: tab === "subscription",
  });
  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["admin-subscription-invoices"],
    queryFn: async () => {
      const r = await api.get("/subscription/invoices");
      return r.data.data;
    },
    enabled: tab === "subscription",
  });

  const tenantForm = useForm<TenantData>({ resolver: zodResolver(tenantSchema), values: tenant });
  const paymobForm = useForm<PaymobData>({ resolver: zodResolver(paymobSchema) });

  const saveTenant = useMutation({
    mutationFn: async (d: TenantData) => { await api.patch("/admin/tenant", d); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-tenant"] }); toast.success("تم الحفظ"); },
    onError: () => toast.error("فشل الحفظ"),
  });

  const savePaymob = useMutation({
    mutationFn: async (d: PaymobData) => { await api.patch("/admin/tenant/paymob", d); },
    onSuccess: () => toast.success("تم حفظ بيانات بوابة الدفع"),
    onError: () => toast.error("فشل الحفظ"),
  });

  const changeRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => { await api.patch(`/admin/users/${id}/role`, { role }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("تم تغيير الدور"); },
  });
  const renewSubscription = useMutation({
    mutationFn: async () => {
      const r = await api.post("/subscription/renew");
      return r.data.data as { iframeUrl: string };
    },
    onSuccess: (d) => {
      if (d.iframeUrl) window.location.href = d.iframeUrl;
      else toast.success("تم بدء التجديد");
    },
    onError: () => toast.error("فشل بدء التجديد"),
  });
  const cancelSubscription = useMutation({
    mutationFn: async () => { await api.post("/subscription/cancel"); },
    onSuccess: () => {
      toast.success("تم جدولة الإلغاء بنهاية الفترة");
      qc.invalidateQueries({ queryKey: ["admin-subscription"] });
    },
    onError: () => toast.error("فشل إلغاء الاشتراك"),
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

  const periodEnd = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;
  const now = new Date();
  const daysRemaining = periodEnd ? Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / 86400000)) : 0;
  const periodLength = subscription?.billing_cycle === "yearly" ? 365 : 30;
  const progressValue = periodEnd ? Math.min(100, Math.max(0, (daysRemaining / periodLength) * 100)) : 0;

  return (
    <>
      <Helmet><title>إعدادات المنصة</title></Helmet>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">إعدادات المنصة</h1>
        <div className="flex gap-2 mb-8 border-b">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id as typeof tab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>

        {tab === "general" && (
          <form onSubmit={tenantForm.handleSubmit((d) => saveTenant.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2"><Label>اسم الشركة</Label>
                <Input {...tenantForm.register("name")} /></div>
              <div className="space-y-1"><Label>البريد الإلكتروني</Label>
                <Input {...tenantForm.register("contact_email")} /></div>
              <div className="space-y-1"><Label>الهاتف</Label>
                <Input {...tenantForm.register("contact_phone")} /></div>
              <div className="space-y-1"><Label>اللون الرئيسي</Label>
                <div className="flex gap-2">
                  <Input type="color" {...tenantForm.register("primary_color")} className="w-12 p-1 h-10" />
                  <Input {...tenantForm.register("primary_color")} placeholder="#2563eb" />
                </div>
              </div>
              <div className="space-y-1"><Label>اللون الثانوي</Label>
                <div className="flex gap-2">
                  <Input type="color" {...tenantForm.register("secondary_color")} className="w-12 p-1 h-10" />
                  <Input {...tenantForm.register("secondary_color")} placeholder="#7c3aed" />
                </div>
              </div>
              <div className="space-y-1 col-span-2"><Label>العنوان</Label>
                <Input {...tenantForm.register("address")} /></div>
            </div>
            <Button type="submit" disabled={saveTenant.isPending}>حفظ الإعدادات</Button>
          </form>
        )}

        {tab === "paymob" && (
          <form onSubmit={paymobForm.handleSubmit((d) => savePaymob.mutate(d))} className="space-y-4">
            <p className="text-sm text-muted-foreground rounded-lg bg-muted/50 p-3">
              بيانات بوابة الدفع Paymob. يتم تخزينها مشفرة ولا تظهر مرة أخرى بعد الحفظ.
            </p>
            <div className="space-y-1"><Label>API Key</Label>
              <Input type="password" {...paymobForm.register("api_key")} placeholder="ZXhh..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Integration ID</Label>
                <Input {...paymobForm.register("integration_id")} placeholder="123456" />
              </div>
              <div className="space-y-1"><Label>iFrame ID</Label>
                <Input {...paymobForm.register("iframe_id")} placeholder="12345" />
              </div>
            </div>
            <Button type="submit" disabled={savePaymob.isPending}>حفظ بيانات الدفع</Button>
          </form>
        )}

        {tab === "users" && (
          <div className="space-y-3">
            {(users?.items ?? []).map((u: { id: string; full_name: string; email: string; role: string }) => (
              <div key={u.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
                <div>
                  <p className="font-medium">{u.full_name}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                </div>
                <select value={u.role}
                  onChange={(e) => changeRole.mutate({ id: u.id, role: e.target.value })}
                  className="rounded border px-2 py-1 text-sm bg-background">
                  {["customer", "agent", "manager", "admin"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        {tab === "subscription" && (
          <div className="space-y-5">
            {subscription ? (
              <>
                <div className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">الخطة الحالية</p>
                      <p className="text-xl font-semibold">{subscription.plan?.name ?? "—"}</p>
                    </div>
                    <Badge variant={subscription.status === "active" ? "default" : "destructive"}>
                      {subscription.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {periodEnd ? `ينتهي في ${periodEnd.toLocaleDateString("ar-EG")} — متبقي ${daysRemaining} يوم` : "لم يتم تعيين فترة اشتراك"}
                  </div>
                  <Progress value={progressValue} />
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={() => renewSubscription.mutate()} disabled={renewSubscription.isPending}>
                      تجديد الآن
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={cancelSubscription.isPending}
                      onClick={() => {
                        if (window.confirm("تأكيد إلغاء الاشتراك بنهاية الفترة؟")) {
                          cancelSubscription.mutate();
                        }
                      }}
                    >
                      إلغاء الاشتراك
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border bg-card p-4 space-y-3">
                  <p className="font-medium">تغيير الخطة</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlan(plan.code)}
                        className={`rounded-lg border p-3 text-start transition-colors ${
                          selectedPlan === plan.code ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                        }`}
                      >
                        <p className="font-medium">{plan.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {plan.price_egp_monthly.toLocaleString("ar-EG")} ج.م / شهرياً
                        </p>
                      </button>
                    ))}
                  </div>
                  <Button onClick={() => changePlan.mutate()} disabled={!selectedPlan || changePlan.isPending}>
                    تطبيق الخطة المختارة
                  </Button>
                </div>

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
                      {invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(inv.paid_at ?? inv.created_at).toLocaleDateString("ar-EG")}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={inv.status === "succeeded" ? "default" : "outline"}>{inv.status}</Badge>
                          </td>
                          <td className="px-4 py-3 font-medium">{inv.amount_egp.toLocaleString("ar-EG")} ج.م</td>
                        </tr>
                      ))}
                      {invoices.length === 0 && (
                        <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">لا توجد فواتير بعد</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="rounded-xl border bg-card p-6 text-center text-muted-foreground">
                لا يوجد اشتراك مرتبط بهذه المنصة حتى الآن.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
