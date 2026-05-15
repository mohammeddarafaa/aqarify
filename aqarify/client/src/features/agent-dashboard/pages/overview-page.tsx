import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
import { formatCurrency } from "@/lib/format";
import { useTenantStore } from "@/stores/tenant.store";

type AgentStats = {
  reservations: { total: number; confirmed: number; pending: number; cancelled: number };
  leads: { total: number; new: number };
  follow_ups: { total: number; overdue: number; today: number };
  financial: {
    total_revenue: number;
    avg_sale_value: number;
    avg_sale_this_month: number;
    avg_sale_last_month: number;
    avg_sale_delta: number;
    revenue_this_month: number;
    revenue_last_month: number;
    revenue_delta: number;
    confirmed_this_month: number;
  };
  activity_chart: { day: number; value: number }[];
  trends: { deals_mom_pct: number; revenue_mom_pct: number };
};

type OverviewRow = {
  property: string;
  address: string;
  imageUrl: string;
  type: string;
  client: string;
  cost: string;
  views: string;
  status: "available" | "reserved" | "sold";
};

type ReservationItem = {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  units?: { unit_number: string; type: string; project?: { name: string } };
  users?: { full_name: string; email: string; phone: string };
};

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80";

function reservationToBadgeStatus(status: string): OverviewRow["status"] {
  if (status === "confirmed") return "sold";
  if (status === "pending") return "reserved";
  return "available";
}

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
  const { t, i18n } = useTranslation("dashboard");
  const lang = i18n.language.startsWith("ar") ? "ar" : "en";
  const currency = useTenantStore((s) => s.tenant?.currency ?? "EGP");
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");

  const { data: stats, isLoading } = useQuery<AgentStats>({
    queryKey: ["agent-stats"],
    queryFn: async () => {
      const r = await api.get("/agent/stats");
      return r.data.data;
    },
  });

  const { data: reservationPayload } = useQuery({
    queryKey: ["agent-reservations", "overview"],
    queryFn: async () => {
      const r = await api.get("/agent/reservations?page=1&limit=12");
      return r.data.data as { items: ReservationItem[] };
    },
  });

  const chartData = stats?.activity_chart ?? [];
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

  const rows: OverviewRow[] = useMemo(() => {
    const items = reservationPayload?.items ?? [];
    return items.map((r) => {
      const projectName = r.units?.project?.name ?? "—";
      const unitNo = r.units?.unit_number?.trim() ?? "";
      return {
        property: unitNo ? `${projectName} · ${unitNo}` : projectName,
        address: r.users?.phone ?? r.users?.email ?? "—",
        imageUrl: PLACEHOLDER_IMG,
        type: r.units?.type ?? "—",
        client: r.users?.full_name ?? "—",
        cost: formatCurrency(Number(r.total_price) || 0, currency, lang),
        views: t("agent_overview.views_placeholder"),
        status: reservationToBadgeStatus(r.status),
      };
    });
  }, [reservationPayload?.items, currency, lang, t]);

  const columns = useMemo<ColumnDef<OverviewRow>[]>(
    () => [
      {
        accessorKey: "property",
        header: t("agent_overview.col_property"),
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
      { accessorKey: "type", header: t("agent_overview.col_property_type") },
      { accessorKey: "client", header: t("agent_overview.col_client") },
      { accessorKey: "cost", header: t("agent_overview.col_cost") },
      { accessorKey: "views", header: t("agent_overview.col_views") },
      {
        accessorKey: "status",
        header: t("agent_overview.col_status"),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "action",
        header: t("agent_overview.col_action"),
        enableHiding: false,
        cell: () => (
          <button type="button" className="grid h-11 w-11 place-items-center rounded-full bg-background/80 text-foreground">
            <ArrowUpRight className="h-4 w-4" />
          </button>
        ),
      },
    ],
    [t],
  );

  const bestReservation = useMemo(() => {
    const items = [...(reservationPayload?.items ?? [])];
    items.sort((a, b) => (Number(b.total_price) || 0) - (Number(a.total_price) || 0));
    return items[0];
  }, [reservationPayload?.items]);

  const bestTitle = bestReservation
    ? `${bestReservation.units?.project?.name ?? "—"}${bestReservation.units?.unit_number ? ` · ${bestReservation.units.unit_number}` : ""}`
    : "—";

  const avgDelta = stats?.financial.avg_sale_delta ?? 0;
  const avgDeltaAbs = formatCurrency(Math.abs(avgDelta), currency, lang);
  const avgComparison =
    avgDelta > 0
      ? t("agent_overview.avg_sale_more_than_last", { amount: avgDeltaAbs })
      : avgDelta < 0
        ? t("agent_overview.avg_sale_less_than_last", { amount: avgDeltaAbs })
        : t("agent_overview.avg_sale_same_as_last");

  const confirmedProgress = stats?.reservations.total
    ? Math.min(100, Math.round((stats.reservations.confirmed / stats.reservations.total) * 100))
    : 0;
  const pendingProgress = stats?.reservations.total
    ? Math.min(100, Math.round((stats.reservations.pending / stats.reservations.total) * 100))
    : 0;

  const dealsTrend = stats?.trends.deals_mom_pct ?? 0;
  const revenueTrend = stats?.trends.revenue_mom_pct ?? 0;

  return (
    <>
      <Helmet>
        <title>{t("agent_overview.helm_title")}</title>
      </Helmet>
      <div className="mx-auto max-w-[1600px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">{t("agent_overview.main_goals")}</p>
            <h1 className="sr-only">{t("agent_overview.page_title")}</h1>
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
                  title={t("agent_overview.kpi_confirmed_title")}
                  value={String(stats?.reservations.confirmed ?? 0)}
                  subtitle={t("agent_overview.kpi_confirmed_sub")}
                  progress={confirmedProgress}
                  progressColor="lime"
                />
                <KpiCard
                  title={t("agent_overview.kpi_pending_title")}
                  value={String(stats?.reservations.pending ?? 0)}
                  subtitle={t("agent_overview.kpi_pending_sub")}
                  progress={pendingProgress}
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
              title={t("agent_overview.mini_completed")}
              label={t("agent_overview.mini_label_month")}
              value={(stats?.financial.confirmed_this_month ?? 0).toLocaleString()}
              trend={{
                direction: dealsTrend >= 0 ? "up" : "down",
                value: Math.abs(Math.round(dealsTrend)),
              }}
            />
            <MiniMetricCard
              title={t("agent_overview.mini_revenue")}
              label={t("agent_overview.mini_label_month")}
              value={formatCurrency(stats?.financial.revenue_this_month ?? 0, currency, lang)}
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
                totalVisits={String(stats?.leads.total ?? 0)}
                imageUrl={PLACEHOLDER_IMG}
              />
            ) : (
              <div className="flex min-h-[320px] items-center justify-center rounded-[2rem] border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
                {t("agent_overview.no_top_reservation")}
              </div>
            )}
          </div>

          <section className="rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-[0_24px_70px_-55px_rgb(20_20_20/.65)] xl:col-span-5">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{t("agent_overview.avg_sale_title")}</p>
                <p className="mt-8 text-sm text-muted-foreground">{t("agent_overview.mini_label_month")}</p>
                <div className="mt-1 flex flex-wrap items-baseline gap-4">
                  <span className="text-2xl font-medium">
                    {formatCurrency(stats?.financial.avg_sale_this_month ?? 0, currency, lang)}
                  </span>
                  <span className="text-sm text-muted-foreground">{avgComparison}</span>
                </div>
              </div>
            </div>
            <PillBarChart data={chartData.length ? chartData : [{ day: 1, value: 0 }]} activeDay={activeChartDay} height={210} />
          </section>
        </div>

        <DataTableShell
          columns={columns}
          data={rows}
          searchPlaceholder={t("agent_overview.table_search")}
          exportFileName="properties-overview"
          filters={[
            {
              key: "district",
              label: t("agent_overview.filter_district"),
              value: "all",
              options: [
                { value: "all", label: t("agent_overview.filter_district") },
                { value: "new-cairo", label: t("agent_overview.district_new_cairo") },
              ],
            },
            {
              key: "property-type",
              label: t("agent_overview.filter_property_type"),
              value: "all",
              options: [
                { value: "all", label: t("agent_overview.filter_property_type") },
                { value: "apartments", label: t("agent_overview.property_type_apartments") },
              ],
            },
            {
              key: "status",
              label: t("agent_overview.filter_status"),
              value: "all",
              options: [
                { value: "all", label: t("agent_overview.filter_status") },
                { value: "available", label: t("status.available", { ns: "common" }) },
              ],
            },
            {
              key: "cost",
              label: t("agent_overview.filter_cost"),
              value: "all",
              options: [
                { value: "all", label: t("agent_overview.filter_cost") },
                { value: "high", label: t("agent_overview.cost_high") },
              ],
            },
          ]}
        />
      </div>
    </>
  );
}
