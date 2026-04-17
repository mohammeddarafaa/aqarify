import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";

type SalesReport = {
  confirmed: number;
  cancelled: number;
  total_revenue: number;
  monthly: { month: string; count: number; revenue: number }[];
};
type FinancialReport = {
  total_collected: number;
  total_pending: number;
  total_overdue: number;
  by_type: { reservation_fee: number; down_payment: number; installment: number };
};
type InventoryReport = {
  by_status: Record<string, number>;
  by_type: { type: string; count: number }[];
};
type AgentReport = { agent_id: string; agent_name: string; count: number; revenue: number }[];

const COLORS = ["#22c55e", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6"];
const PERIODS = [
  { label: "آخر 30 يوم", days: 30 },
  { label: "آخر 90 يوم", days: 90 },
  { label: "هذا العام", days: 365 },
];

function formatEGP(v: number) {
  return `${(v / 1000).toFixed(0)}k`;
}

export default function ManagerReportsPage() {
  const [period, setPeriod] = useState(30);
  const from = new Date(Date.now() - period * 86400000).toISOString().split("T")[0];

  const sales = useQuery<SalesReport>({
    queryKey: ["reports-sales", period],
    queryFn: async () => (await api.get(`/reports/sales?from=${from}`)).data.data,
  });
  const financial = useQuery<FinancialReport>({
    queryKey: ["reports-financial", period],
    queryFn: async () => (await api.get(`/reports/financial?from=${from}`)).data.data,
  });
  const inventory = useQuery<InventoryReport>({
    queryKey: ["reports-inventory"],
    queryFn: async () => (await api.get("/reports/inventory")).data.data,
  });
  const agents = useQuery<AgentReport>({
    queryKey: ["reports-agents", period],
    queryFn: async () => (await api.get(`/reports/agents?from=${from}`)).data.data,
  });

  const isLoading =
    sales.isLoading || financial.isLoading || inventory.isLoading || agents.isLoading;

  const st = inventory.data?.by_status ?? {};
  const pieData = [
    { name: "متاح", value: st.available ?? 0 },
    { name: "محجوز", value: st.reserved ?? 0 },
    { name: "مباع", value: st.sold ?? 0 },
  ];

  const financialBar = financial.data
    ? [
        { name: "محصل", value: financial.data.total_collected },
        { name: "معلق", value: financial.data.total_pending },
        { name: "متأخر", value: financial.data.total_overdue },
      ]
    : [];

  return (
    <>
      <Helmet>
        <title>التقارير</title>
      </Helmet>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">التقارير</h1>
          <div className="flex gap-2">
            {PERIODS.map((p) => (
              <Button
                key={p.days}
                size="sm"
                variant={period === p.days ? "default" : "outline"}
                onClick={() => setPeriod(p.days)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground">جاري تحميل التقارير...</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="col-span-2 space-y-3 rounded-xl border bg-card p-5">
              <h2 className="font-semibold">مبيعات شهرية</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={sales.data?.monthly ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="count" orientation="left" tick={{ fontSize: 11 }} />
                  <YAxis
                    yAxisId="revenue"
                    orientation="right"
                    tickFormatter={formatEGP}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(v, name) =>
                      name === "revenue"
                        ? `${Number(v).toLocaleString("ar-EG")} ج.م`
                        : v
                    }
                  />
                  <Legend />
                  <Line
                    yAxisId="count"
                    type="monotone"
                    dataKey="count"
                    name="حجوزات"
                    stroke="#141414"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="revenue"
                    name="إيرادات"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3 rounded-xl border bg-card p-5">
              <h2 className="font-semibold">حالة الوحدات</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3 rounded-xl border bg-card p-5">
              <h2 className="font-semibold">المالية (ج.م)</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={financialBar}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={formatEGP} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => `${Number(v).toLocaleString("ar-EG")} ج.م`} />
                  <Bar dataKey="value" name="المبلغ" fill="#141414" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {Array.isArray(agents.data) && agents.data.length > 0 && (
              <div className="col-span-2 space-y-3 rounded-xl border bg-card p-5">
                <h2 className="font-semibold">أداء الموظفين</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={agents.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agent_name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="حجوزات" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
