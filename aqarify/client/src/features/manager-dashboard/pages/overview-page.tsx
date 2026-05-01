import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui-kit";
import { Building2, TrendingUp, Users, Clock } from "lucide-react";
import { SaaSPageShell } from "@/components/shared/saas-page-shell";
import { SaaSKpiCard } from "@/components/shared/saas-kpi-card";

type DashData = {
  units: { total: number; available?: number; reserved?: number; sold?: number };
  reservations: { total: number; confirmed?: number; pending?: number; cancelled?: number };
  revenue: { total: number };
  leads: { total: number; new?: number };
};

export default function ManagerOverviewPage() {
  const { data, isLoading } = useQuery<DashData>({
    queryKey: ["manager-dashboard"],
    queryFn: async () => (await api.get("/manager/dashboard")).data.data,
  });

  const kpis = data
    ? [
        {
          label: "إجمالي الوحدات",
          value: data.units.total,
          sub: `${data.units.available ?? 0} متاح`,
          icon: Building2,
        },
        {
          label: "الحجوزات المؤكدة",
          value: data.reservations.confirmed ?? 0,
          sub: `${data.reservations.pending ?? 0} معلق`,
          icon: Clock,
        },
        {
          label: "الإيرادات المحصلة",
          value: `${(data.revenue.total / 1000).toFixed(0)}k`,
          sub: "ج.م",
          icon: TrendingUp,
        },
        {
          label: "العملاء المحتملين",
          value: data.leads.total,
          sub: `${data.leads.new ?? 0} جديد`,
          icon: Users,
        },
      ]
    : [];

  return (
    <>
      <Helmet>
        <title>نظرة عامة المدير</title>
      </Helmet>
      <SaaSPageShell
        title="نظرة عامة المدير"
        description="مؤشرات سريعة لحالة المخزون، الحجوزات، الإيرادات، والعملاء المحتملين."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))
            : kpis.map(({ label, value, sub, icon: Icon }) => (
                <SaaSKpiCard key={label} title={label} value={value} subtitle={sub} icon={Icon} />
              ))}
        </div>
      </SaaSPageShell>
    </>
  );
}
