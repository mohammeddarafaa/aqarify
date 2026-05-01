import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { CalendarDays, CreditCard, Home, Phone } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { useTenantStore } from "@/stores/tenant.store";
import { useTenantUi } from "@/hooks/use-tenant-ui";
import { appendTenantSearch } from "@/lib/tenant-path";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Payment = {
  id: string;
  amount: number;
  due_date: string;
  status: string;
  reservation_id?: string | null;
};

function formatEgp(n: number) {
  return Number(n).toLocaleString("ar-EG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

type Reservation = {
  id: string;
  status: string;
  total_price: number;
  reservation_fee_paid?: number | null;
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

  const paidTotalForActiveReservation = useMemo(() => {
    if (!activeRes) return 0;
    return payments
      .filter((p) => p.reservation_id === activeRes.id && p.status === "paid")
      .reduce((sum, p) => sum + Number(p.amount), 0);
  }, [payments, activeRes]);

  /** إن لم تُنشأ جدولة مدفوعات بعد، نظهر ما سُجِّل على سجلّ الحجز */
  const paidFallbackFromReservation =
    paidTotalForActiveReservation === 0 && activeRes?.reservation_fee_paid
      ? Number(activeRes.reservation_fee_paid)
      : 0;

  const displayTotalPaidSoFar =
    paidTotalForActiveReservation > 0 ? paidTotalForActiveReservation : paidFallbackFromReservation;

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
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={activeRes.status === "confirmed" ? "success" : "warning"}>
                    {activeRes.status === "confirmed" ? "مؤكد" : "في الانتظار"}
                  </Badge>
                </div>
                <div className="mt-3 space-y-3 border-t border-border/60 pt-3">
                  <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      إجمالي ما دفعته حتى الآن
                    </p>
                    <p className="text-xl font-bold tabular-nums text-foreground md:text-2xl">
                      {formatEgp(displayTotalPaidSoFar)} ج.م
                    </p>
                    {paidTotalForActiveReservation === 0 && paidFallbackFromReservation > 0 ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        وفق رسوم مسجَّلة على الحجز قبل إنشاء جدول الدفعات
                      </p>
                    ) : paidTotalForActiveReservation === 0 ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        ستظهر المبالغ المسدَّدة هنا عند تسجيل دفعاتك في صفحة مدفوعاتي
                      </p>
                    ) : null}
                  </div>
                  <div className="text-xs">
                    <p className="text-muted-foreground">إجمالي قيمة الوحدة (سعر العقد)</p>
                    <p className="text-lg font-semibold tabular-nums text-foreground">
                      {formatEgp(activeRes.total_price)} ج.م
                    </p>
                  </div>
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
                <p className="text-2xl font-bold tabular-nums">{formatEgp(nextPayment.amount)} ج.م</p>
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
