import { supabaseAdmin } from "../config/supabase";

export async function getSalesReport(tenantId: string, from?: string, to?: string) {
  let query = supabaseAdmin.from("reservations")
    .select("id, status, total_price, reservation_fee_paid, created_at, agent_id, units(type, size_sqm, project_id)")
    .eq("tenant_id", tenantId).in("status", ["confirmed", "cancelled"]);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);
  const { data } = await query;

  const confirmed = (data ?? []).filter((r) => r.status === "confirmed");
  const totalRevenue = confirmed.reduce((s, r) => s + (r.total_price ?? 0), 0);

  // Monthly breakdown
  const byMonth: Record<string, { count: number; revenue: number }> = {};
  confirmed.forEach((r) => {
    const month = r.created_at.slice(0, 7);
    if (!byMonth[month]) byMonth[month] = { count: 0, revenue: 0 };
    byMonth[month].count++;
    byMonth[month].revenue += r.total_price ?? 0;
  });

  return {
    total_reservations: (data ?? []).length,
    confirmed: confirmed.length,
    cancelled: (data ?? []).filter((r) => r.status === "cancelled").length,
    total_revenue: totalRevenue,
    avg_price: confirmed.length ? totalRevenue / confirmed.length : 0,
    monthly: Object.entries(byMonth).map(([month, v]) => ({ month, ...v })).sort((a, b) => a.month.localeCompare(b.month)),
    raw: data ?? [],
  };
}

export async function getFinancialReport(tenantId: string, from?: string, to?: string) {
  let query = supabaseAdmin.from("payments")
    .select("type, amount, status, due_date, paid_at").eq("tenant_id", tenantId);
  if (from) query = query.gte("due_date", from);
  if (to) query = query.lte("due_date", to);
  const { data } = await query;

  const paid = (data ?? []).filter((p) => p.status === "paid");
  const pending = (data ?? []).filter((p) => p.status === "pending");
  const overdue = (data ?? []).filter((p) => p.status === "overdue");

  const sum = (arr: typeof paid) => arr.reduce((s, p) => s + (p.amount ?? 0), 0);

  return {
    total_collected: sum(paid),
    total_pending: sum(pending),
    total_overdue: sum(overdue),
    by_type: {
      reservation_fee: sum(paid.filter((p) => p.type === "reservation_fee")),
      down_payment: sum(paid.filter((p) => p.type === "down_payment")),
      installment: sum(paid.filter((p) => p.type === "installment")),
    },
    raw: data ?? [],
  };
}

export async function getInventoryReport(tenantId: string) {
  const { data } = await supabaseAdmin.from("units")
    .select("type, size_sqm, status, price, bedrooms, project_id").eq("tenant_id", tenantId);

  const byStatus: Record<string, number> = {};
  const byType: Record<string, { total: number; available: number; avg_price: number; prices: number[] }> = {};

  (data ?? []).forEach((u) => {
    byStatus[u.status] = (byStatus[u.status] ?? 0) + 1;
    if (!byType[u.type]) byType[u.type] = { total: 0, available: 0, avg_price: 0, prices: [] };
    byType[u.type].total++;
    if (u.status === "available") byType[u.type].available++;
    byType[u.type].prices.push(u.price ?? 0);
  });

  Object.values(byType).forEach((t) => {
    t.avg_price = t.prices.length ? t.prices.reduce((s, p) => s + p, 0) / t.prices.length : 0;
  });

  return {
    total: (data ?? []).length,
    by_status: byStatus,
    by_type: Object.entries(byType).map(([type, v]) => ({ type, ...v, prices: undefined })),
  };
}

export async function getAgentPerformanceReport(tenantId: string, from?: string, to?: string) {
  let query = supabaseAdmin
    .from("reservations")
    .select("agent_id, total_price, status, users!agent_id(full_name)")
    .eq("tenant_id", tenantId)
    .eq("status", "confirmed");
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);
  const { data } = await query;

  const byAgent: Record<string, { agent_name: string; count: number; revenue: number }> = {};
  (data ?? []).forEach((r) => {
    const u = r.users as { full_name?: string } | { full_name?: string }[] | null | undefined;
    const nameFromUser = Array.isArray(u) ? u[0]?.full_name : u?.full_name;
    const id = r.agent_id ?? "unassigned";
    const name = nameFromUser ?? "غير معين";
    if (!byAgent[id]) byAgent[id] = { agent_name: name, count: 0, revenue: 0 };
    byAgent[id].count++;
    byAgent[id].revenue += Number(r.total_price ?? 0);
  });
  return Object.entries(byAgent).map(([agent_id, v]) => ({ agent_id, ...v }));
}
