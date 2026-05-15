import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight, Building2, ClipboardCheck, TrendingDown, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { AiFeatureBanner } from "@/components/shared/ai-feature-banner";
import { BestPropertyCard } from "@/components/shared/best-property-card";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { KpiCard } from "@/components/shared/kpi-card";
import { PeriodSelector } from "@/components/shared/period-selector";
import { PillBarChart } from "@/components/shared/pill-bar-chart";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { useTenantStore } from "@/stores/tenant.store";
import { useMemo, useState } from "react";

type DashData = {
  units: { total: number; available?: number; reserved?: number; sold?: number };
  reservations: { total: number; confirmed?: number; pending?: number; cancelled?: number };
  revenue: { total: number };
  leads: { total: number; new?: number };
  financial?: {
    avg_sale_this_month: number;
    avg_sale_last_month: number;
    avg_sale_delta: number;
    revenue_this_month: number;
    revenue_last_month: number;
    revenue_delta: number;
    confirmed_this_month: number;
  };
  activity_chart?: { day: number; value: number }[];
  trends?: { deals_mom_pct: number; revenue_mom_pct: number };
};

type ReservationItem = {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  units?: {
    unit_number: string;
    type: string;
    gallery?: string[] | null;
    project?: { name: string } | null;
  };
  users?: { full_name: string; email: string; phone: string };
  assigned_agent?: { full_name: string } | null;
};

type PropertyRow = {
  property: string;
  address: string;
  imageUrl: string;
  type: string;
  agent: string;
  cost: string;
  views: string;
  status: "available" | "reserved" | "sold";
};

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80";

function reservationToBadgeStatus(status: string): PropertyRow["status"] {
  if (status === "confirmed") return "sold";
  if (status === "pending") return "reserved";
  return "available";
}

function unitImage(gallery: string[] | null | undefined): string {
  const first = gallery?.find((u) => typeof u === "string" && u.length > 0);
  return first ?? PLACEHOLDER_IMG;
}

function MetricCard({
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
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-8 text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-medium leading-none">{value}</p>
        </div>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-background/80">
          <ArrowUpRight className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-5 flex items-center justify-end gap-3">
        <div
          className="h-20 w-20 rounded-full"
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

export default function ManagerOverviewPage() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const lang = useTenantStore((s) => {
    const l = s.tenant?.default_locale ?? "ar-EG";
    return l.startsWith("ar") ? "ar" : "en";
  });
  const currency = useTenantStore((s) => s.tenant?.currency ?? s.tenant?.fallback_currency ?? "EGP");

  const { data, isLoading } = useQuery<DashData>({
    queryKey: ["manager-dashboard"],
    queryFn: async () => (await api.get("/manager/dashboard")).data.data,
  });

  const { data: reservationPayload } = useQuery({
    queryKey: ["manager-reservations", "overview"],
    queryFn: async () => {
      const r = await api.get("/manager/reservations?page=1&limit=12");
      return r.data.data as { items: ReservationItem[] };
    },
  });

  const chartData = data?.activity_chart ?? [];
  const activeChartDay = useMemo(() => {
    if (!chartData.length) return undefined;
    const today = new Date().getDate();
    if (chartData.some((d) => d.day === today)) return today;
    let best = chartData[0]!;
    for (const d of chartData) {
      if (d.value > best.value) best = d;
    }
    return best.day;
  }, [chartData]);

  const rows: PropertyRow[] = useMemo(() => {
    const items = reservationPayload?.items ?? [];
    return items.map((r) => {
      const projectName = r.units?.project?.name ?? "—";
      const unitNo = r.units?.unit_number?.trim() ?? "";
      return {
        property: unitNo ? `${projectName} · ${unitNo}` : projectName,
        address: r.users?.phone ?? r.users?.email ?? "—",
        imageUrl: unitImage(r.units?.gallery ?? undefined),
        type: r.units?.type ?? "—",
        agent: r.assigned_agent?.full_name?.trim() || "—",
        cost: formatCurrency(Number(r.total_price) || 0, currency, lang),
        views: "—",
        status: reservationToBadgeStatus(r.status),
      };
    });
  }, [reservationPayload?.items, currency, lang]);

  const columns = useMemo<ColumnDef<PropertyRow>[]>(
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
          <button type="button" className="grid h-11 w-11 place-items-center rounded-full bg-background/80">
            <ArrowUpRight className="h-4 w-4" />
          </button>
        ),
      },
    ],
    [],
  );

  const bestReservation = useMemo(() => {
    const items = [...(reservationPayload?.items ?? [])];
    items.sort((a, b) => (Number(b.total_price) || 0) - (Number(a.total_price) || 0));
    return items[0];
  }, [reservationPayload?.items]);

  const bestTitle = bestReservation
    ? `${bestReservation.units?.project?.name ?? "—"}${bestReservation.units?.unit_number ? ` · ${bestReservation.units.unit_number}` : ""}`
    : "—";

  const fin = data?.financial;
  const avgDelta = fin?.avg_sale_delta ?? 0;
  const avgDeltaAbs = formatCurrency(Math.abs(avgDelta), currency, lang);
  const avgComparison =
    avgDelta > 0
      ? `${avgDeltaAbs} more than last month`
      : avgDelta < 0
        ? `${avgDeltaAbs} less than last month`
        : "Same as last month";

  const confirmedProgress = data?.reservations.total
    ? Math.min(100, Math.round(((data.reservations.confirmed ?? 0) / data.reservations.total) * 100))
    : 0;
  const pendingProgress = data?.reservations.total
    ? Math.min(100, Math.round(((data.reservations.pending ?? 0) / data.reservations.total) * 100))
    : 0;

  const revenueCollected = formatCurrency(data?.revenue.total ?? 0, currency, lang);
  const reservedUnitsSubtitle = `${data?.units.reserved ?? 0} reserved units`;
  const dealsTrend = data?.trends?.deals_mom_pct ?? 0;
  const revenueTrend = data?.trends?.revenue_mom_pct ?? 0;

  const dealsThisMonth = fin?.confirmed_this_month ?? 0;

  return (
    <>
      <Helmet>
        <title>نظرة عامة المدير</title>
      </Helmet>
      <div className="mx-auto max-w-[1600px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Main goals</p>
            <h1 className="sr-only">نظرة عامة المدير</h1>
          </div>
          <PeriodSelector value={period} onValueChange={setPeriod} />
        </div>

        <div className="grid gap-4 xl:grid-cols-12">
          <div className="grid gap-4 sm:grid-cols-2 xl:col-span-6">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-[2rem]" />)
            ) : (
              <>
                <KpiCard
                  title="Collected payments"
                  value={revenueCollected}
                  subtitle={`${data?.reservations.confirmed ?? 0} confirmed reservations`}
                  progress={confirmedProgress}
                  progressColor="lime"
                  icon={Building2}
                />
                <KpiCard
                  title="Reserved units"
                  value={String(data?.units.reserved ?? 0)}
                  subtitle={reservedUnitsSubtitle}
                  progress={pendingProgress}
                  progressColor="striped"
                  icon={ClipboardCheck}
                />
              </>
            )}
          </div>

          <div className="xl:col-span-6">
            <AiFeatureBanner />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:col-span-4 xl:grid-cols-1">
            <MetricCard
              title="Deals (confirmed)"
              label="This month"
              value={dealsThisMonth.toLocaleString()}
              trend={{
                direction: dealsTrend >= 0 ? "up" : "down",
                value: Math.abs(Math.round(dealsTrend)),
              }}
            />
            <MetricCard
              title="Reservation value"
              label="This month"
              value={formatCurrency(fin?.revenue_this_month ?? 0, currency, lang)}
              trend={{
                direction: revenueTrend >= 0 ? "up" : "down",
                value: Math.abs(Math.round(revenueTrend)),
              }}
            />
          </div>

          <div className="xl:col-span-3">
            {bestReservation ? (
              <BestPropertyCard
                title={bestTitle}
                totalSales={formatCurrency(Number(bestReservation.total_price) || 0, currency, lang)}
                totalVisits={String(data?.leads.total ?? 0)}
                imageUrl={unitImage(bestReservation.units?.gallery ?? undefined)}
              />
            ) : (
              <div className="flex min-h-[320px] items-center justify-center rounded-[2rem] border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
                No reservations yet
              </div>
            )}
          </div>

          <section className="rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-[0_24px_70px_-55px_rgb(20_20_20/.65)] xl:col-span-5">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Average sale value</p>
                <p className="mt-8 text-sm text-muted-foreground">This month</p>
                <div className="mt-1 flex flex-wrap items-baseline gap-4">
                  <span className="text-2xl font-medium">
                    {formatCurrency(fin?.avg_sale_this_month ?? 0, currency, lang)}
                  </span>
                  <span className="text-sm text-muted-foreground">{avgComparison}</span>
                </div>
              </div>
            </div>
            <PillBarChart
              data={chartData.length ? chartData : [{ day: 1, value: 0 }]}
              activeDay={activeChartDay}
              height={210}
            />
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
