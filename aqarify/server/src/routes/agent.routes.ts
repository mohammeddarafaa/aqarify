import { Router } from "express";
import { z } from "zod";
import { resolveTenant, requireTenant, type TenantRequest } from "../middleware/tenant";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { supabaseAdmin } from "../config/supabase";
import { sendSuccess, sendError, ERROR_CODES } from "../utils/response";
import { potentialCustomerRoutes } from "./potentialCustomers.routes";

const RESERVATION_STATUS_PATCH = ["confirmed", "cancelled", "expired"] as const;
const allowedReservationStatusByRole: Record<string, (typeof RESERVATION_STATUS_PATCH)[number][]> = {
  agent: ["cancelled"],
  manager: ["confirmed", "cancelled", "expired"],
  admin: ["confirmed", "cancelled", "expired"],
  super_admin: ["confirmed", "cancelled", "expired"],
};

export const agentRoutes = Router();
agentRoutes.use(resolveTenant, authenticate, requireTenant, requireRole("agent", "manager", "admin", "super_admin"));

// GET /api/v1/agent/stats — KPI dashboard stats
agentRoutes.get("/stats", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const isAgent = req.userRole === "agent";
    const agentId = req.userId!;
    const tenantId = req.tenantId!;

    let tRes = supabaseAdmin.from("reservations").select("status").eq("tenant_id", tenantId);
    if (isAgent) tRes = tRes.eq("agent_id", agentId);
    const { data: resData } = await tRes;
    const resStats = { total: 0, confirmed: 0, pending: 0, cancelled: 0 };
    if (resData) {
      resStats.total = resData.length;
      resStats.confirmed = resData.filter(r => r.status === "confirmed").length;
      resStats.pending = resData.filter(r => r.status === "pending").length;
      resStats.cancelled = resData.filter(r => r.status === "cancelled").length;
    }

    let tLeads = supabaseAdmin.from("potential_customers").select("negotiation_status").eq("tenant_id", tenantId);
    if (isAgent) tLeads = tLeads.eq("assigned_agent_id", agentId);
    const { data: leadsData } = await tLeads;
    const leadsStats = { total: 0, new: 0 };
    if (leadsData) {
      leadsStats.total = leadsData.length;
      leadsStats.new = leadsData.filter(l => l.negotiation_status === "new").length;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const now = new Date();
    let tFollowUps = supabaseAdmin.from("follow_ups").select("status, scheduled_at").eq("tenant_id", tenantId);
    if (isAgent) tFollowUps = tFollowUps.eq("agent_id", agentId);
    const { data: fuData } = await tFollowUps;
    const fuStats = { total: 0, overdue: 0, today: 0 };
    if (fuData) {
      fuStats.total = fuData.length;
      fuStats.overdue = fuData.filter(f => f.status === "scheduled" && new Date(f.scheduled_at) < now).length;
      fuStats.today = fuData.filter(f => f.status === "scheduled" && f.scheduled_at.startsWith(todayStr)).length;
    }

    return sendSuccess(res, {
      reservations: resStats,
      leads: leadsStats,
      follow_ups: fuStats,
    });
  } catch (err) { return next(err); }
});

// GET /api/v1/agent/reservations — reservations assigned to this agent
agentRoutes.get("/reservations", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const status = req.query.status as string | undefined;

    let query = supabaseAdmin.from("reservations")
      .select("*, units(unit_number, type, project:projects(name)), users!customer_id(full_name, email, phone)", { count: "exact" })
      .eq("tenant_id", req.tenantId!).order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (req.userRole === "agent") query = query.eq("agent_id", req.userId!);
    if (status) query = query.eq("status", status);

    const { data, count } = await query;
    return sendSuccess(res, { items: data ?? [], total: count ?? 0, page, limit });
  } catch (err) { return next(err); }
});

// PATCH /api/v1/agent/reservations/:id/status
const statusSchema = z.object({
  status: z.enum(RESERVATION_STATUS_PATCH),
  reason: z.string().optional(),
});
agentRoutes.patch("/reservations/:id/status", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid status", 400);

    const role = req.userRole ?? "";
    const allowed = allowedReservationStatusByRole[role];
    if (!allowed?.includes(parsed.data.status)) {
      return sendError(res, ERROR_CODES.AUTH_FORBIDDEN, "Role cannot set this status", 403);
    }

    const { data, error } = await supabaseAdmin.from("reservations")
      .update({ status: parsed.data.status, agent_id: req.userId! })
      .eq("id", req.params.id).eq("tenant_id", req.tenantId!).select().single();

    if (error || !data) return sendError(res, ERROR_CODES.RESERVATION_NOT_FOUND, "Reservation not found", 404);
    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});

agentRoutes.use("/potential-customers", potentialCustomerRoutes);

// GET/POST /api/v1/agent/follow-ups
agentRoutes.get("/follow-ups", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const { date, status } = req.query as Record<string, string>;
    let q = supabaseAdmin.from("follow_ups")
      .select("*, potential_customers(name, phone)")
      .eq("tenant_id", req.tenantId!)
      .order("scheduled_at", { ascending: true });

    if (req.userRole === "agent") q = q.eq("agent_id", req.userId!);
    if (date) {
      q = q.gte("scheduled_at", `${date}T00:00:00Z`).lte("scheduled_at", `${date}T23:59:59Z`);
    }
    if (status) q = q.eq("status", status);

    const { data } = await q;
    return sendSuccess(res, data ?? []);
  } catch (err) { return next(err); }
});

const followUpSchema = z.object({
  potential_customer_id: z.string().uuid(),
  type: z.enum(["call", "whatsapp", "email", "visit", "other"]),
  scheduled_at: z.string().min(1),
  notes: z.string().optional(),
});

agentRoutes.post("/follow-ups", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const parsed = followUpSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid input", 400);

    const { data, error } = await supabaseAdmin.from("follow_ups").insert({
      tenant_id: req.tenantId!,
      agent_id: req.userId!,
      potential_customer_id: parsed.data.potential_customer_id,
      type: parsed.data.type,
      scheduled_at: parsed.data.scheduled_at,
      notes: parsed.data.notes ?? null,
      status: "scheduled",
    }).select("*").single();

    if (error) throw error;
    return sendSuccess(res, data, undefined, 201);
  } catch (err) { return next(err); }
});

agentRoutes.patch("/follow-ups/:id/complete", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const { outcome, notes } = req.body as { outcome?: string; notes?: string };
    let q = supabaseAdmin.from("follow_ups")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        outcome: outcome ?? null,
        ...(notes !== undefined ? { notes } : {}),
      })
      .eq("id", req.params.id)
      .eq("tenant_id", req.tenantId!);
    if (req.userRole === "agent") q = q.eq("agent_id", req.userId!);
    const { data, error } = await q.select().single();
    if (error || !data) return sendError(res, ERROR_CODES.NOT_FOUND, "Not found", 404);
    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});

agentRoutes.delete("/follow-ups/:id", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    let q = supabaseAdmin.from("follow_ups").delete().eq("id", req.params.id).eq("tenant_id", req.tenantId!);
    if (req.userRole === "agent") q = q.eq("agent_id", req.userId!);
    await q;
    return sendSuccess(res, { deleted: true });
  } catch (err) { return next(err); }
});
