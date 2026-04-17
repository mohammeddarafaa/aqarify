import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import { useMyReservations } from "@/features/reservation/hooks/use-reservation";
import { useMyWaitingEntry } from "@/features/waiting-list/hooks/use-waiting-list";
import { useAuthStore } from "@/stores/auth.store";
import { useTenantStore } from "@/stores/tenant.store";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  CalendarDays,
  CreditCard,
  Home,
  Clock,
  ArrowLeft,
  Search,
  Sparkles,
} from "lucide-react";
import { BentoGrid, BentoGridItem } from "@/components/aceternity/bento-grid";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { appendTenantSearch } from "@/lib/tenant-path";

type Payment = {
  id: string;
  type: string;
  amount: number;
  due_date: string;
  status: string;
};

const STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "في الانتظار", variant: "secondary" },
  confirmed: { label: "مؤكد", variant: "default" },
  cancelled: { label: "ملغي", variant: "destructive" },
  rejected: { label: "مرفوض", variant: "destructive" },
};

function initials(name?: string | null) {
  if (!name) return "؟";
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function CustomerDashboardPage() {
  const { pathname, search } = useLocation();
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);
  const user = useAuthStore((s) => s.user);
  const tenant = useTenantStore((s) => s.tenant);
  const { data: reservations = [], isLoading: resLoading } = useMyReservations();
  const { data: waitingEntry } = useMyWaitingEntry();
  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["my-payments"],
    queryFn: async () => {
      const r = await api.get("/payments");
      return r.data.data;
    },
  });

  const upcomingPayments = payments
    .filter((p) => p.status === "pending" && new Date(p.due_date) >= new Date())
    .sort(
      (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
    )
    .slice(0, 5);

  const nextPayment = upcomingPayments[0];
  const daysUntilNext = nextPayment
    ? Math.max(
        0,
        Math.ceil(
          (new Date(nextPayment.due_date).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  return (
    <>
      <Helmet>
        <title>{tenant?.name ? `${tenant.name} — لوحتي` : "لوحة التحكم"}</title>
      </Helmet>
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* Greeting hero */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Avatar size="lg" className="ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials(user?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                مرحباً، {user?.full_name ?? "عميلنا العزيز"}
              </h1>
              <p className="text-sm text-muted-foreground">
                نظرة سريعة على نشاطك في بوابة {tenant?.name ?? "المطور"}
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="gap-2">
            <Link to={withTenant("/browse")}>
              <Search className="h-4 w-4" /> تصفح الوحدات
            </Link>
          </Button>
        </div>

        {/* Bento overview */}
        <BentoGrid className="md:auto-rows-[11rem]">
          <BentoGridItem
            className="md:col-span-1"
            icon={<Home className="h-5 w-5 text-primary" />}
            title={<span className="text-3xl font-bold">{reservations.length}</span>}
            description="إجمالي حجوزاتي"
          />
          <BentoGridItem
            className="md:col-span-1"
            icon={<CreditCard className="h-5 w-5 text-primary" />}
            title={<span className="text-3xl font-bold">{payments.length}</span>}
            description="إجمالي المدفوعات"
          />
          <BentoGridItem
            className="md:col-span-1"
            icon={<Clock className="h-5 w-5 text-primary" />}
            title={
              <span className="text-3xl font-bold">
                {waitingEntry ? `#${waitingEntry.position}` : "—"}
              </span>
            }
            description={
              waitingEntry
                ? "مركزك في قائمة الانتظار"
                : "لست في قائمة الانتظار حالياً"
            }
          />

          {/* Next payment: big card */}
          <BentoGridItem
            className="md:col-span-2 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent"
            icon={<CalendarDays className="h-5 w-5 text-primary" />}
            title={
              nextPayment ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    {nextPayment.amount.toLocaleString("ar-EG")}
                  </span>
                  <span className="text-sm text-muted-foreground">ج.م</span>
                </div>
              ) : (
                <span className="text-xl font-semibold text-muted-foreground">
                  لا توجد مدفوعات قادمة
                </span>
              )
            }
            description={
              nextPayment
                ? `القسط القادم خلال ${daysUntilNext} يوم — ${new Date(
                    nextPayment.due_date,
                  ).toLocaleDateString("ar-EG")}`
                : "أنت على اطلاع بكل مدفوعاتك"
            }
          />

          <BentoGridItem
            className="md:col-span-1 bg-primary text-primary-foreground [&_*]:!text-primary-foreground"
            icon={<Sparkles className="h-5 w-5" />}
            title="اكتشف وحدات جديدة"
            description="تصفح أحدث العروض المتاحة"
            header={
              <Link
                to={withTenant("/browse")}
                className="group absolute inset-0 flex items-end justify-end p-5"
              >
                <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1 rtl:rotate-180" />
              </Link>
            }
          />
        </BentoGrid>

        {/* Reservations */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">حجوزاتي</h2>
            {reservations.length > 10 && (
              <span className="text-xs text-muted-foreground">
                عرض آخر 10 حجوزات
              </span>
            )}
          </div>

          <div className="rounded-xl border bg-card overflow-hidden">
            {resLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : reservations.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-14 text-center">
                <Home className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-muted-foreground">لا توجد حجوزات بعد</p>
                <Button asChild size="sm">
                  <Link to={withTenant("/browse")}>ابدأ التصفح الآن</Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">رقم الحجز</TableHead>
                    <TableHead className="text-start">الحالة</TableHead>
                    <TableHead className="text-start hidden sm:table-cell">
                      تاريخ الإنشاء
                    </TableHead>
                    <TableHead className="text-start">المبلغ</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.slice(0, 10).map((r) => {
                    const status = STATUS_MAP[r.status] ?? {
                      label: r.status,
                      variant: "outline" as const,
                    };
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">
                          #{r.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                          {new Date(r.created_at).toLocaleDateString("ar-EG")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {r.total_price?.toLocaleString("ar-EG")} ج.م
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </section>

        {/* Upcoming payments timeline */}
        {upcomingPayments.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">مدفوعات قادمة</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingPayments.map((p) => {
                const days = Math.ceil(
                  (new Date(p.due_date).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24),
                );
                const urgent = days <= 7;
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "rounded-xl border bg-card p-4 space-y-3 transition-shadow hover:shadow-sm",
                      urgent && "border-amber-300/60 bg-amber-50/40",
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {p.type === "installment" ? "قسط" : p.type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(p.due_date).toLocaleDateString("ar-EG")}
                        </p>
                      </div>
                      <Badge variant={urgent ? "destructive" : "outline"}>
                        {days === 0 ? "اليوم" : `خلال ${days} يوم`}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      {p.amount.toLocaleString("ar-EG")}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        ج.م
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
