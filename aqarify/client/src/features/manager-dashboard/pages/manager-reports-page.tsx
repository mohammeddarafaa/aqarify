import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type ReportResp = unknown;

function Card({ title, data }: { title: string; data: ReportResp }) {
  const list = Array.isArray(data) ? data : [];
  return (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      <h2 className="font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">عدد السجلات: {list.length}</p>
      <pre className="max-h-48 overflow-auto rounded bg-muted/50 p-2 text-xs" dir="ltr">
        {JSON.stringify((list as unknown[]).slice(0, 5), null, 2)}
      </pre>
    </div>
  );
}

export default function ManagerReportsPage() {
  const sales = useQuery({ queryKey: ["reports-sales"], queryFn: async () => (await api.get("/reports/sales")).data.data });
  const financial = useQuery({ queryKey: ["reports-financial"], queryFn: async () => (await api.get("/reports/financial")).data.data });
  const inventory = useQuery({ queryKey: ["reports-inventory"], queryFn: async () => (await api.get("/reports/inventory")).data.data });
  const agents = useQuery({ queryKey: ["reports-agents"], queryFn: async () => (await api.get("/reports/agents")).data.data });

  const isLoading = sales.isLoading || financial.isLoading || inventory.isLoading || agents.isLoading;
  return (
    <>
      <Helmet><title>التقارير</title></Helmet>
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-4">
        <h1 className="text-2xl font-bold">التقارير</h1>
        <p className="text-sm text-muted-foreground">ملخصات فورية من تقارير المبيعات، المالية، المخزون، وأداء الموظفين.</p>
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">جاري تحميل التقارير...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="تقرير المبيعات" data={sales.data ?? []} />
            <Card title="التقرير المالي" data={financial.data ?? []} />
            <Card title="تقرير المخزون" data={inventory.data ?? []} />
            <Card title="تقرير أداء الموظفين" data={agents.data ?? []} />
          </div>
        )}
      </div>
    </>
  );
}
