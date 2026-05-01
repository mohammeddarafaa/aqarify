import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { CalendarDays, CreditCard, Home, Phone } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { useTenantStore } from "@/stores/tenant.store";
import { useTenantUi } from "@/hooks/use-tenant-ui";
import { appendTenantSearch } from "@/lib/tenant-path";
import { Badge, Button, Skeleton } from "@/components/ui-kit";

type Payment = { id: string; amount: number; due_date: string; status: string };

type Reservation = {
  id: string;
  status: string;
  total_price: number;
  units?: {
    unit_number: string;
    type: string;
    projects?: { name: string } | null;
  } | null;
  assigned_agent?: { full_name: string; phone: string | null } | null;
};

export default function CustomerOverviewPage() {
  const user = useAuthStore((s) => s.user);
  const tenant = useTenantStore((s) => s.tenant);
  const { appName } = useTenantUi();
  const { pathname, search } = useLocation();
  const withTenant = (p: string) => appendTenantSearch(pathname, search, p);

  const { data: reservations = [], isLoading: resLoading } = useQuery<Reservation[]>({
    queryKey: ["my-reservations"],
    queryFn: async () => (await api.get("/reservations")).data.data,
  });

  const { data: payments = [], isLoading: payLoading } = useQuery<Payment[]>({
    queryKey: ["my-payments-overview"],
    queryFn: async () => (await api.get("/payments")).data.data,
  });

  const confirmedRes = reservations.find((r) => r.status === "confirmed");
  const pendingRes = reservations.find((r) => r.status === "pending");
  const activeRes = confirmedRes ?? pendingRes;

  const nextPayment = payments
    .filter((p) => p.status === "pending" && new Date(p.due_date) >= new Date())
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];

  const overduePayments = payments.filter((p) => p.status === "overdue");

  const agent = activeRes?.assigned_agent;

  return (
    <>
      <Helmet>
        <title>نظرتي — {appName}</title>
      </Helmet>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            أهلاً، {user?.full_name?.split(" ")[0] ?? "عزيزي العميل"} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            إليك ملخص حسابك مع {tenant?.name ?? "المنصة"}
          </p>
        </div>

        {overduePayments.length > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
            <CreditCard className="h-5 w-5 shrink-0 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">
                لديك {overduePayments.length} دفعة متأخرة
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                يرجى التواصل مع موظفك أو الدفع من صفحة المدفوعات
              </p>
            </div>
            <Button size="sm" variant="destructive" asChild>
              <Link to={withTenant("/payments")}>الدفع الآن</Link>
            </Button>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Home className="h-4 w-4 text-primary" /> حجزك الحالي
            </div>
            {resLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : activeRes ? (
              <div className="space-y-1">
                <p className="text-lg font-bold">
                  {activeRes.units?.unit_number ?? "—"}
                  {activeRes.units?.projects?.name
                    ? ` — ${activeRes.units.projects.name}`
                    : ""}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant={activeRes.status === "confirmed" ? "default" : "secondary"}>
                    {activeRes.status === "confirmed" ? "مؤكد" : "في الانتظار"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {Number(activeRes.total_price).toLocaleString("ar-EG")} ج.م
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                لا يوجد حجز نشط.{" "}
                <Link to={withTenant("/browse")} className="text-primary underline">
                  تصفح الوحدات
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="h-4 w-4 text-primary" /> الدفعة القادمة
            </div>
            {payLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : nextPayment ? (
              <div className="space-y-1">
                <p className="text-2xl font-bold">
                  {Number(nextPayment.amount).toLocaleString("ar-EG")} ج.م
                </p>
                <p className="text-xs text-muted-foreground">
                  تاريخ الاستحقاق:{" "}
                  {new Date(nextPayment.due_date).toLocaleDateString("ar-EG")}
                </p>
                <Button size="sm" className="mt-1" asChild>
                  <Link to={withTenant("/payments")}>عرض الجدول</Link>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">لا توجد دفعات قادمة</p>
            )}
          </div>
        </div>

        {agent ? (
          <div className="flex items-center gap-4 rounded-xl border bg-card p-5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10">
              <Phone className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">موظفك المعين</p>
              <p className="font-semibold">{agent.full_name}</p>
              {agent.phone ? (
                <p className="text-sm text-muted-foreground">{agent.phone}</p>
              ) : null}
            </div>
            {agent.phone ? (
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${agent.phone}`}>اتصال</a>
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}
