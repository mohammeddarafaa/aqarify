import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { AiFeatureBanner } from "@/components/shared/ai-feature-banner";
import { BestPropertyCard } from "@/components/shared/best-property-card";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { KpiCard } from "@/components/shared/kpi-card";
import { PeriodSelector } from "@/components/shared/period-selector";
import { PillBarChart } from "@/components/shared/pill-bar-chart";
import { cn } from "@/lib/utils";

type AgentStats = {
  reservations: { total: number; confirmed: number; pending: number; cancelled: number };
  leads: { total: number; new: number };
  follow_ups: { total: number; overdue: number; today: number };
};

type OverviewRow = {
  property: string;
  address: string;
  imageUrl: string;
  type: string;
  agent: string;
  cost: string;
  views: string;
  status: "available" | "reserved" | "sold";
};

function MiniMetricCard({
  title,
  label,
  value,
  trend,
}: {
  title: string;
  label: string;
  value: string | number;
  trend: { value: number; direction: "up" | "down" };
}) {
  const isUp = trend.direction === "up";

  return (
    <article className="rounded-[2rem] border border-border/70 bg-card/70 p-5 shadow-[0_24px_70px_-55px_rgb(20_20_20/.65)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-8 text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-medium leading-none">{value}</p>
        </div>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-background/80">
          <ArrowUpRight className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-5 flex items-center justify-end gap-3">
        <div
          className={cn("h-20 w-20 rounded-full", isUp ? "bg-lime" : "bg-destructive")}
          style={{
            clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)",
            background: `conic-gradient(${isUp ? "var(--lime)" : "var(--destructive)"} 0deg 112deg, rgb(20 20 20 / 0.12) 112deg 180deg, transparent 180deg)`,
          }}
        />
        <span className={cn("inline-flex items-center gap-1 text-sm font-medium", isUp ? "text-emerald-600" : "text-destructive")}>
          {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {trend.value}%
        </span>
      </div>
    </article>
  );
}

export default function AgentOverviewPage() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");

  const { data: stats, isLoading } = useQuery<AgentStats>({
    queryKey: ["agent-stats"],
    queryFn: async () => {
      const r = await api.get("/agent/stats");
      return r.data.data;
    },
  });

  const chartData = useMemo(
    () => [
      { day: 1, value: 18 },
      { day: 2, value: 12 },
      { day: 3, value: 24 },
      { day: 4, value: 31 },
      { day: 5, value: 9 },
      { day: 6, value: 21 },
      { day: 7, value: 29 },
      { day: 8, value: 17 },
      { day: 9, value: 25 },
      { day: 10, value: 14 },
      { day: 11, value: 28 },
      { day: 12, value: 33 },
      { day: 13, value: 37 },
      { day: 14, value: 26 },
      { day: 15, value: 22 },
      { day: 16, value: 42 },
      { day: 17, value: 35 },
    ],
    [],
  );

  const propertyImage = "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80";

  const rows: OverviewRow[] = useMemo(
    () => [
      {
        property: "Green Oasis Residence",
        address: "3284 Skyview Lane, WA 98001",
        imageUrl: propertyImage,
        type: "Apartments",
        agent: "John K.",
        cost: "$ 692,000",
        views: "1251 views",
        status: "available",
      },
      {
        property: "Cedar Park Lofts",
        address: "14 West Park Road, Cairo",
        imageUrl: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1000&q=80",
        type: "Duplex",
        agent: "Mona A.",
        cost: "$ 844,500",
        views: "934 views",
        status: "reserved",
      },
      {
        property: "Northline Villas",
        address: "72 Garden View, New Cairo",
        imageUrl: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1000&q=80",
        type: "Villa",
        agent: "Omar S.",
        cost: "$ 1,420,000",
        views: "721 views",
        status: "sold",
      },
    ],
    [propertyImage],
  );

  const columns = useMemo<ColumnDef<OverviewRow>[]>(
    () => [
      {
        accessorKey: "property",
        header: "Property",
        cell: ({ row }) => (
          <div className="flex min-w-[260px] items-center gap-4">
            <img src={row.original.imageUrl} alt="" className="h-16 w-24 rounded-xl object-cover" />
            <div>
              <p className="font-medium text-foreground">{row.original.property}</p>
              <p className="mt-1 text-xs text-muted-foreground">{row.original.address}</p>
            </div>
          </div>
        ),
      },
      { accessorKey: "type", header: "Property type" },
      { accessorKey: "agent", header: "Agent" },
      { accessorKey: "cost", header: "Cost" },
      { accessorKey: "views", header: "Views" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "action",
        header: "Action",
        enableHiding: false,
        cell: () => (
          <button type="button" className="grid h-11 w-11 place-items-center rounded-full bg-background/80 text-foreground">
            <ArrowUpRight className="h-4 w-4" />
          </button>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <Helmet><title>نظرة عامة الموظف</title></Helmet>
      <div className="mx-auto max-w-[1600px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Main goals</p>
            <h1 className="sr-only">نظرة عامة الموظف</h1>
          </div>
          <PeriodSelector value={period} onValueChange={setPeriod} />
        </div>

        <div className="grid gap-4 xl:grid-cols-12">
          <div className="grid gap-4 sm:grid-cols-2 xl:col-span-6">
            {isLoading
              ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-[2rem]" />)
              : (
                <>
                  <KpiCard
                    title="Apartments sold"
                    value={`$ ${(stats?.reservations.confirmed ?? 0).toLocaleString()}`}
                    subtitle="Closed reservations"
                    progress={82}
                    progressColor="lime"
                  />
                  <KpiCard
                    title="Apartments rented"
                    value={`$ ${(stats?.reservations.pending ?? 0).toLocaleString()}`}
                    subtitle="Pending approval"
                    progress={64}
                    progressColor="striped"
                  />
                </>
              )}
          </div>

          <div className="xl:col-span-6">
            <AiFeatureBanner />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:col-span-4 xl:grid-cols-1">
            <MiniMetricCard
              title="Completed Deals"
              label="This month"
              value={(stats?.reservations.total ?? 0).toLocaleString()}
              trend={{ direction: "down", value: 36 }}
            />
            <MiniMetricCard
              title="Total Revenue"
              label="This month"
              value="$ 873,421.39"
              trend={{ direction: "up", value: 49 }}
            />
          </div>

          <div className="xl:col-span-3">
            <BestPropertyCard
              title="Green Oasis Residence"
              totalSales="124"
              totalVisits="539"
              imageUrl={propertyImage}
            />
          </div>

          <section className="rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-[0_24px_70px_-55px_rgb(20_20_20/.65)] xl:col-span-5">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Average Sale Value</p>
                <p className="mt-8 text-sm text-muted-foreground">This month</p>
                <div className="mt-1 flex flex-wrap items-baseline gap-4">
                  <span className="text-2xl font-medium">$ 873,421.39</span>
                  <span className="text-sm text-muted-foreground">$125,458.24 more than last month</span>
                </div>
              </div>
              <PeriodSelector value="daily" onValueChange={() => undefined} />
            </div>
            <PillBarChart data={chartData} activeDay={17} height={210} />
          </section>
        </div>

        <DataTableShell
          columns={columns}
          data={rows}
          searchPlaceholder="Search"
          exportFileName="properties-overview"
          filters={[
            {
              key: "district",
              label: "District",
              value: "all",
              options: [
                { value: "all", label: "District" },
                { value: "new-cairo", label: "New Cairo" },
              ],
            },
            {
              key: "property-type",
              label: "Property type",
              value: "all",
              options: [
                { value: "all", label: "Property type" },
                { value: "apartments", label: "Apartments" },
              ],
            },
            {
              key: "status",
              label: "Status",
              value: "all",
              options: [
                { value: "all", label: "Status" },
                { value: "available", label: "Available" },
              ],
            },
            {
              key: "cost",
              label: "Cost",
              value: "all",
              options: [
                { value: "all", label: "Cost" },
                { value: "high", label: "High value" },
              ],
            },
          ]}
        />
      </div>
    </>
  );
}
