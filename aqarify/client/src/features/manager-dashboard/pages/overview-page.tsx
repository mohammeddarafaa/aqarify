import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, TrendingUp, Users, Clock } from "lucide-react";

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
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight">نظرة عامة</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))
            : kpis.map(({ label, value, sub, icon: Icon }) => (
                <div key={label} className="space-y-2 rounded-xl border bg-card p-5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon className="h-4 w-4" /> {label}
                  </div>
                  <p className="text-3xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              ))}
        </div>
      </div>
    </>
  );
}
