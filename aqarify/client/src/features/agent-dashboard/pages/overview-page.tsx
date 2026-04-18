import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { appendTenantSearch } from "@/lib/tenant-path";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText, PhoneCall, ClipboardList, TrendingUp,
  Clock, CheckCircle2, AlertTriangle, Users,
} from "lucide-react";

type AgentStats = {
  reservations: { total: number; confirmed: number; pending: number; cancelled: number };
  leads: { total: number; new: number };
  follow_ups: { total: number; overdue: number; today: number };
};

function StatCard({
  label, value, sub, icon: Icon, accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  accent?: "default" | "success" | "warning" | "danger";
}) {
  const tints = {
    default: "bg-primary/10 text-primary",
    success: "bg-emerald-50 text-emerald-600",
    warning: "bg-amber-50 text-amber-600",
    danger: "bg-rose-50 text-rose-600",
  };
  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <div className={cn("inline-flex items-center justify-center h-9 w-9 rounded-lg", tints[accent ?? "default"])}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1 opacity-70">{sub}</p>}
      </div>
    </div>
  );
}

const QUICK_LINKS = [
  {
    title: "الحجوزات",
    description: "راجع الطلبات الجديدة وحدد الإجراء المناسب لكل حجز.",
    to: "/agent/reservations",
    icon: FileText,
    cta: "فتح الحجوزات",
  },
  {
    title: "العملاء المحتملون",
    description: "تابع مراحل العملاء من أول تواصل وحتى التحويل.",
    to: "/agent/leads",
    icon: PhoneCall,
    cta: "إدارة العملاء المحتملين",
  },
  {
    title: "المتابعات",
    description: "نظم مكالماتك وزياراتك اليومية بدون فقد أي موعد.",
    to: "/agent/follow-ups",
    icon: ClipboardList,
    cta: "عرض المتابعات",
  },
];

export default function AgentOverviewPage() {
  const { pathname, search } = useLocation();
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);

  const { data: stats, isLoading } = useQuery<AgentStats>({
    queryKey: ["agent-stats"],
    queryFn: async () => {
      const r = await api.get("/agent/stats");
      return r.data.data;
    },
  });

  return (
    <>
      <Helmet><title>نظرة عامة الموظف</title></Helmet>
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">نظرة عامة الموظف</h1>
          <p className="text-sm text-muted-foreground mt-1">
            ابدأ يومك من هنا ثم انتقل مباشرة إلى الحجوزات، العملاء المحتملين، أو المتابعات.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)
            : stats && (
              <>
                <StatCard
                  label="الحجوزات الكلية"
                  value={stats.reservations.total}
                  sub={`${stats.reservations.confirmed} مؤكد`}
                  icon={TrendingUp}
                />
                <StatCard
                  label="حجوزات معلقة"
                  value={stats.reservations.pending}
                  sub="تحتاج مراجعة"
                  icon={Clock}
                  accent={stats.reservations.pending > 0 ? "warning" : "success"}
                />
                <StatCard
                  label="عملاء محتملون"
                  value={stats.leads.total}
                  sub={`${stats.leads.new} جديد`}
                  icon={Users}
                />
                <StatCard
                  label="متابعات متأخرة"
                  value={stats.follow_ups.overdue}
                  sub={`${stats.follow_ups.today} اليوم`}
                  icon={stats.follow_ups.overdue > 0 ? AlertTriangle : CheckCircle2}
                  accent={stats.follow_ups.overdue > 0 ? "danger" : "success"}
                />
              </>
            )}
        </div>

        {/* Alert if overdue follow-ups */}
        {!isLoading && (stats?.follow_ups.overdue ?? 0) > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">لديك {stats!.follow_ups.overdue} متابعة متأخرة</p>
              <p className="text-xs text-muted-foreground mt-0.5">يُنصح ببدء يومك بها لضمان سرعة التحويل.</p>
            </div>
            <Link
              to={withTenant("/agent/follow-ups")}
              className="text-xs font-medium text-destructive hover:underline shrink-0 mt-0.5"
            >
              عرضها الآن
            </Link>
          </div>
        )}

        {/* Quick navigation cards */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">البوابات السريعة</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {QUICK_LINKS.map(({ title, description, to, icon: Icon, cta }) => (
              <div key={to} className="rounded-xl border bg-card p-5 space-y-3 hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
                <Link to={withTenant(to)} className="text-sm text-primary hover:underline font-medium">
                  {cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
