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
  const { data: agents } = await supabaseAdmin.from("users")
    .select("id, full_name, email").eq("tenant_id", tenantId).in("role", ["agent", "manager"]);

  const report = await Promise.all((agents ?? []).map(async (agent) => {
    let q = supabaseAdmin.from("reservations")
      .select("status, total_price, reservation_fee_paid").eq("tenant_id", tenantId).eq("agent_id", agent.id);
    if (from) q = q.gte("created_at", from);
    if (to) q = q.lte("created_at", to);
    const { data: res } = await q;

    const confirmed = (res ?? []).filter((r) => r.status === "confirmed");
    const totalSales = confirmed.reduce((s, r) => s + (r.total_price ?? 0), 0);

    const { count: followUps } = await supabaseAdmin.from("follow_ups")
      .select("*", { count: "exact", head: true }).eq("agent_id", agent.id).eq("tenant_id", tenantId);

    return {
      agent_id: agent.id,
      full_name: agent.full_name,
      email: agent.email,
      total_reservations: (res ?? []).length,
      confirmed: confirmed.length,
      total_sales: totalSales,
      follow_ups: followUps ?? 0,
      conversion_rate: (res ?? []).length ? Math.round((confirmed.length / (res ?? []).length) * 100) : 0,
    };
  }));

  return report.sort((a, b) => b.total_sales - a.total_sales);
}
