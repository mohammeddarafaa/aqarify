import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { appendTenantSearch } from "@/lib/tenant-path";
import {
  Skeleton,
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui-kit";
import { SaaSPageShell } from "@/components/shared/saas-page-shell";
import { SaaSKpiCard } from "@/components/shared/saas-kpi-card";
import {
  FileText, PhoneCall, ClipboardList, TrendingUp,
  Clock, CheckCircle2, AlertTriangle, Users,
} from "lucide-react";

type AgentStats = {
  reservations: { total: number; confirmed: number; pending: number; cancelled: number };
  leads: { total: number; new: number };
  follow_ups: { total: number; overdue: number; today: number };
};

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
      <SaaSPageShell
        title="نظرة عامة الموظف"
        description="ابدأ يومك من هنا ثم انتقل مباشرة إلى الحجوزات، العملاء المحتملين، أو المتابعات."
      >
        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)
            : stats && (
              <>
                <SaaSKpiCard title="الحجوزات الكلية" value={stats.reservations.total} subtitle={`${stats.reservations.confirmed} مؤكد`} icon={TrendingUp} />
                <SaaSKpiCard
                  title="حجوزات معلقة"
                  value={stats.reservations.pending}
                  subtitle="تحتاج مراجعة"
                  icon={Clock}
                  tone={stats.reservations.pending > 0 ? "warning" : "success"}
                />
                <SaaSKpiCard
                  title="عملاء محتملون"
                  value={stats.leads.total}
                  subtitle={`${stats.leads.new} جديد`}
                  icon={Users}
                />
                <SaaSKpiCard
                  title="متابعات متأخرة"
                  value={stats.follow_ups.overdue}
                  subtitle={`${stats.follow_ups.today} اليوم`}
                  icon={stats.follow_ups.overdue > 0 ? AlertTriangle : CheckCircle2}
                  tone={stats.follow_ups.overdue > 0 ? "danger" : "success"}
                />
              </>
            )}
        </div>

        {/* Alert if overdue follow-ups */}
        {!isLoading && (stats?.follow_ups.overdue ?? 0) > 0 && (
          <Alert>
            <AlertTriangle className="size-4 text-destructive" />
            <AlertDescription className="flex w-full items-center justify-between gap-3">
              <span>
                لديك {stats!.follow_ups.overdue} متابعة متأخرة. يُنصح ببدء يومك بها لضمان سرعة التحويل.
              </span>
              <Link to={withTenant("/agent/follow-ups")} className="shrink-0 text-xs font-medium text-destructive hover:underline">
                عرضها الآن
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Quick navigation cards */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">البوابات السريعة</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {QUICK_LINKS.map(({ title, description, to, icon: Icon, cta }) => (
              <Card key={to} className="shadow-none transition-colors hover:border-primary/40">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="size-4 text-primary" />
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{description}</p>
                  <Link to={withTenant(to)} className="text-sm font-medium text-primary hover:underline">
                    {cta} →
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </SaaSPageShell>
    </>
  );
}
