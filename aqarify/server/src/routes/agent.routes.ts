import { Router } from "express";
import { z } from "zod";
import { resolveTenant, type TenantRequest } from "../middleware/tenant";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { supabaseAdmin } from "../config/supabase";
import { sendSuccess, sendError, ERROR_CODES } from "../utils/response";

export const agentRoutes = Router();
agentRoutes.use(resolveTenant, authenticate, requireRole("agent", "manager", "admin", "super_admin"));

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
const statusSchema = z.object({ status: z.enum(["confirmed", "cancelled", "rejected"]), reason: z.string().optional() });
agentRoutes.patch("/reservations/:id/status", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid status", 400);

    const { data, error } = await supabaseAdmin.from("reservations")
      .update({ status: parsed.data.status, agent_id: req.userId! })
      .eq("id", req.params.id).eq("tenant_id", req.tenantId!).select().single();

    if (error || !data) return sendError(res, ERROR_CODES.RESERVATION_NOT_FOUND, "Reservation not found", 404);
    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});

// GET /api/v1/agent/potential-customers
agentRoutes.get("/potential-customers", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const stage = req.query.stage as string | undefined;

    let query = supabaseAdmin.from("potential_customers")
      .select("*", { count: "exact" }).eq("tenant_id", req.tenantId!)
      .order("created_at", { ascending: false }).range((page - 1) * limit, page * limit - 1);

    if (stage) query = query.eq("stage", stage);

    const { data, count } = await query;
    return sendSuccess(res, { items: data ?? [], total: count ?? 0, page, limit });
  } catch (err) { return next(err); }
});

const leadSchema = z.object({
  full_name: z.string().min(2), phone: z.string().min(10),
  email: z.string().email().optional(), source: z.string().optional(),
  preferred_type: z.string().optional(), budget_min: z.number().optional(),
  budget_max: z.number().optional(), notes: z.string().optional(),
});

// POST /api/v1/agent/potential-customers
agentRoutes.post("/potential-customers", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const parsed = leadSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid input", 400, parsed.error.flatten());

    const { data, error } = await supabaseAdmin.from("potential_customers").insert({
      tenant_id: req.tenantId!, assigned_agent_id: req.userId!,
      ...parsed.data, stage: "new",
    }).select().single();

    if (error) throw error;
    return sendSuccess(res, data, undefined, 201);
  } catch (err) { return next(err); }
});

// PATCH /api/v1/agent/potential-customers/:id/stage
agentRoutes.patch("/potential-customers/:id/stage", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const schema = z.object({ stage: z.enum(["new", "contacted", "interested", "viewing", "negotiating", "converted", "lost"]) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid stage", 400);

    const { data } = await supabaseAdmin.from("potential_customers")
      .update({ stage: parsed.data.stage }).eq("id", req.params.id)
      .eq("tenant_id", req.tenantId!).select().single();

    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});

// GET/POST /api/v1/agent/follow-ups
agentRoutes.get("/follow-ups", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const { date, status } = req.query as Record<string, string>;
    let q = supabaseAdmin.from("follow_ups")
      .select("*, potential_customers(full_name, phone)")
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
