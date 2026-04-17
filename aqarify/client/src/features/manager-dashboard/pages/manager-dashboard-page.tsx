import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { BarChart3, Building2, Users, CreditCard, FileText } from "lucide-react";

interface Stats {
  units: { total: number; available?: number; reserved?: number; sold?: number };
  reservations: { total: number; pending?: number; confirmed?: number };
  revenue: { total: number };
  leads: { total: number; new?: number; converted?: number };
}

export default function ManagerDashboardPage() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["manager-stats"],
    queryFn: async () => { const r = await api.get("/manager/dashboard"); return r.data.data; },
  });

  const cards = [
    { icon: Building2, label: "إجمالي الوحدات", value: stats?.units.total, sub: `متاح: ${stats?.units.available ?? 0}` },
    { icon: FileText, label: "الحجوزات", value: stats?.reservations.total, sub: `معلق: ${stats?.reservations.pending ?? 0}` },
    { icon: CreditCard, label: "الإيرادات المحصّلة", value: `${(stats?.revenue.total ?? 0).toLocaleString("ar-EG")} ج.م`, sub: "" },
    { icon: Users, label: "العملاء المحتملون", value: stats?.leads.total, sub: `محوّل: ${stats?.leads.converted ?? 0}` },
  ];

  return (
    <>
      <Helmet><title>نظرة عامة المدير</title></Helmet>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">نظرة عامة المدير</h1>
        <p className="text-sm text-muted-foreground mb-6">
          راقب مؤشرات الأداء اليومية ثم انتقل مباشرة لإدارة الوحدات، الفريق، وقائمة الانتظار.
        </p>
        {isLoading ? (
          <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
              {cards.map(({ icon: Icon, label, value, sub }) => (
                <div key={label} className="rounded-xl border bg-card p-4 space-y-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold">{value ?? "—"}</p>
                  {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
                </div>
              ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border bg-card p-4">
                <h2 className="font-semibold mb-3 flex items-center gap-2"><Building2 className="h-4 w-4" />حالة الوحدات</h2>
                <div className="space-y-2">
                  {[
                    { label: "متاح", value: stats?.units.available ?? 0, color: "bg-green-500" },
                    { label: "محجوز", value: stats?.units.reserved ?? 0, color: "bg-yellow-500" },
                    { label: "مباع", value: stats?.units.sold ?? 0, color: "bg-blue-500" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
                      <span className="text-sm flex-1">{label}</span>
                      <span className="text-sm font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border bg-card p-4">
                <h2 className="font-semibold mb-3 flex items-center gap-2"><BarChart3 className="h-4 w-4" />قمع المبيعات</h2>
                <div className="space-y-2">
                  {[
                    { label: "جديد", value: stats?.leads.new ?? 0 },
                    { label: "تم التواصل", value: (stats?.leads as Record<string, number>)?.contacted ?? 0 },
                    { label: "مهتم", value: (stats?.leads as Record<string, number>)?.interested ?? 0 },
                    { label: "تفاوض", value: (stats?.leads as Record<string, number>)?.negotiating ?? 0 },
                    { label: "محوّل", value: stats?.leads.converted ?? 0 },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-sm flex-1 text-muted-foreground">{label}</span>
                      <div className="h-2 flex-1 max-w-32 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${stats?.leads.total ? Math.round((value / stats.leads.total) * 100) : 0}%` }} />
                      </div>
                      <span className="text-sm font-medium w-6 text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
