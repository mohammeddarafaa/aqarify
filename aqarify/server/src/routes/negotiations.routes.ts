import { Router } from "express";
import { z } from "zod";
import { resolveTenant, requireTenant, type TenantRequest } from "../middleware/tenant";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { supabaseAdmin } from "../config/supabase";
import { sendSuccess, sendError, ERROR_CODES } from "../utils/response";

export const negotiationRoutes = Router();
negotiationRoutes.use(resolveTenant, authenticate, requireTenant, requireRole("agent", "manager", "admin"));

// GET /api/v1/negotiations — all potential customers (leads)
negotiationRoutes.get("/leads", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    let query = supabaseAdmin.from("potential_customers")
      .select("*, users!assigned_agent_id(full_name)")
      .eq("tenant_id", req.tenantId!)
      .order("created_at", { ascending: false });

    // Agents see only their own leads
    if (req.userRole === "agent") query = query.eq("assigned_agent_id", req.userId!);
    const statusFilter = req.query.negotiation_status ?? req.query.stage;
    if (statusFilter) query = query.eq("negotiation_status", String(statusFilter));

    const { data } = await query;
    return sendSuccess(res, data ?? []);
  } catch (err) { return next(err); }
});

const leadSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  source: z.enum(["inquiry", "referral", "reservation_cancelled", "waitlist_expired"]).default("inquiry"),
  interested_unit_types: z.array(z.string()).optional(),
  budget_min: z.number().optional(),
  budget_max: z.number().optional(),
  preferred_locations: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

// POST /api/v1/negotiations/leads — create manual lead
negotiationRoutes.post("/leads", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const parsed = leadSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid input", 400, parsed.error.flatten());
    const { full_name, ...rest } = parsed.data;
    const { data, error } = await supabaseAdmin.from("potential_customers").insert({
      tenant_id: req.tenantId!,
      assigned_agent_id: req.userId!,
      name: full_name,
      negotiation_status: "new",
      phone: rest.phone ?? null,
      email: rest.email ?? null,
      source: rest.source,
      interested_unit_types: rest.interested_unit_types ?? [],
      budget_min: rest.budget_min ?? null,
      budget_max: rest.budget_max ?? null,
      preferred_locations: rest.preferred_locations ?? [],
      notes: rest.notes ?? null,
    }).select().single();
    if (error) throw error;
    return sendSuccess(res, data, undefined, 201);
  } catch (err) { return next(err); }
});

// PATCH /api/v1/negotiations/leads/:id/stage
negotiationRoutes.patch("/leads/:id/stage", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const negotiationStatuses = [
      "new",
      "contacted",
      "negotiating",
      "offer_made",
      "accepted",
      "rejected",
      "lost",
    ] as const;
    const stageSchema = z.object({
      negotiation_status: z.enum(negotiationStatuses).optional(),
      stage: z.enum(negotiationStatuses).optional(),
    });
    const parsed = stageSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid stage", 400);
    }
    const nextStatus = parsed.data.negotiation_status ?? parsed.data.stage;
    if (!nextStatus) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "negotiation_status or stage required", 400);
    }
    const { data } = await supabaseAdmin.from("potential_customers")
      .update({ negotiation_status: nextStatus, last_contact_at: new Date().toISOString() })
      .eq("id", req.params.id).eq("tenant_id", req.tenantId!).select().single();
    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});

// GET /api/v1/negotiations/:leadId/offers
negotiationRoutes.get("/:leadId/offers", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const { data } = await supabaseAdmin.from("negotiations")
      .select("*, units(unit_number, type, price), users!created_by(full_name)")
      .eq("potential_customer_id", req.params.leadId).eq("tenant_id", req.tenantId!)
      .order("created_at", { ascending: false });
    return sendSuccess(res, data ?? []);
  } catch (err) { return next(err); }
});

const offerSchema = z.object({
  unit_id: z.string().uuid(),
  offered_price: z.number().positive(),
  discount_pct: z.number().min(0).max(100).optional(),
  special_terms: z.string().optional(),
  counter_price: z.number().positive().optional(),
  status: z.enum(["pending", "accepted", "rejected", "countered"]).default("pending"),
});

// POST /api/v1/negotiations/:leadId/offers
negotiationRoutes.post("/:leadId/offers", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const parsed = offerSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid input", 400, parsed.error.flatten());
    const { data, error } = await supabaseAdmin.from("negotiations").insert({
      tenant_id: req.tenantId!,
      potential_customer_id: req.params.leadId,
      created_by: req.userId!,
      ...parsed.data,
    }).select().single();
    if (error) throw error;
    // Update lead stage to negotiating
    await supabaseAdmin.from("potential_customers")
      .update({ stage: "negotiating" }).eq("id", req.params.leadId);
    return sendSuccess(res, data, undefined, 201);
  } catch (err) { return next(err); }
});

// PATCH /api/v1/negotiations/offers/:offerId
negotiationRoutes.patch("/offers/:offerId", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const updateSchema = z.object({ status: z.enum(["accepted", "rejected", "countered"]), counter_price: z.number().optional() });
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid input", 400);
    const { data } = await supabaseAdmin.from("negotiations")
      .update(parsed.data).eq("id", req.params.offerId).eq("tenant_id", req.tenantId!).select().single();
    if (parsed.data.status === "accepted") {
      await supabaseAdmin.from("potential_customers")
        .update({ stage: "accepted" }).eq("id", data?.potential_customer_id);
    }
    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});
