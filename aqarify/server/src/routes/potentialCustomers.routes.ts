import { Router } from "express";
import { z } from "zod";
import { type TenantRequest } from "../middleware/tenant";
import { type AuthenticatedRequest } from "../middleware/auth";
import { supabaseAdmin } from "../config/supabase";
import { sendSuccess, sendError, ERROR_CODES } from "../utils/response";

const NEGOTIATION_STATUSES = [
  "new",
  "contacted",
  "negotiating",
  "offer_made",
  "accepted",
  "rejected",
  "lost",
] as const;

/** Handlers only — mount under authenticated routes (e.g. `/api/v1/agent` or `/api/v1/potential-customers` with the same middleware stack). */
export const potentialCustomerRoutes = Router();

potentialCustomerRoutes.get("/", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const negotiationStatus =
      (req.query.negotiation_status as string | undefined) ??
      (req.query.stage as string | undefined);

    let query = supabaseAdmin
      .from("potential_customers")
      .select("*", { count: "exact" })
      .eq("tenant_id", req.tenantId!)
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (negotiationStatus) query = query.eq("negotiation_status", negotiationStatus);

    const { data, count } = await query;
    return sendSuccess(res, { items: data ?? [], total: count ?? 0, page, limit });
  } catch (err) {
    return next(err);
  }
});

const leadSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().min(10),
  email: z.union([z.literal(""), z.string().email()]).optional(),
  source: z.string().optional(),
  preferred_type: z.string().optional(),
  budget_min: z.number().optional(),
  budget_max: z.number().optional(),
  notes: z.string().optional(),
});

potentialCustomerRoutes.post("/", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const parsed = leadSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid input", 400, parsed.error.flatten());
    }

    const { full_name, phone, email, source, preferred_type, budget_min, budget_max, notes } = parsed.data;
    const notesCombined =
      preferred_type && notes
        ? `Preferred type: ${preferred_type}\n${notes}`
        : preferred_type
          ? `Preferred type: ${preferred_type}`
          : notes;

    const allowedSources = new Set(["inquiry", "referral", "reservation_cancelled", "waitlist_expired"]);
    const leadSource = source && allowedSources.has(source) ? source : "inquiry";

    const { data, error } = await supabaseAdmin
      .from("potential_customers")
      .insert({
        tenant_id: req.tenantId!,
        assigned_agent_id: req.userId!,
        name: full_name,
        phone,
        email: !email || email === "" ? null : email,
        source: leadSource,
        budget_min: budget_min ?? null,
        budget_max: budget_max ?? null,
        notes: notesCombined ?? null,
        negotiation_status: "new",
      })
      .select()
      .single();

    if (error) throw error;
    return sendSuccess(res, data, undefined, 201);
  } catch (err) {
    return next(err);
  }
});

const patchStatusSchema = z.object({
  negotiation_status: z.enum(NEGOTIATION_STATUSES),
});

potentialCustomerRoutes.patch("/:id/negotiation-status", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const parsed = patchStatusSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid status", 400);

    const { data } = await supabaseAdmin
      .from("potential_customers")
      .update({ negotiation_status: parsed.data.negotiation_status })
      .eq("id", req.params.id)
      .eq("tenant_id", req.tenantId!)
      .select()
      .single();

    return sendSuccess(res, data);
  } catch (err) {
    return next(err);
  }
});

/** @deprecated Prefer PATCH /:id/negotiation-status with body `{ negotiation_status }`. */
potentialCustomerRoutes.patch("/:id/stage", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const legacy = z.object({ stage: z.enum(NEGOTIATION_STATUSES) }).safeParse(req.body);
    if (!legacy.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid status", 400);

    const { data } = await supabaseAdmin
      .from("potential_customers")
      .update({ negotiation_status: legacy.data.stage })
      .eq("id", req.params.id)
      .eq("tenant_id", req.tenantId!)
      .select()
      .single();

    return sendSuccess(res, data);
  } catch (err) {
    return next(err);
  }
});
