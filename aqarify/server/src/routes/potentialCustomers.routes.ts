import { Router } from "express";
import { z } from "zod";
import { type TenantRequest } from "../middleware/tenant";
import { type AuthenticatedRequest } from "../middleware/auth";
import { supabaseAdmin } from "../config/supabase";
import { sendSuccess, sendError, ERROR_CODES } from "../utils/response";
import { isValidPhoneForTenant, normalizePhoneE164 } from "../utils/phone";

const NEGOTIATION_STATUSES = [
  "new",
  "contacted",
  "negotiating",
  "offer_made",
  "accepted",
  "rejected",
  "lost",
] as const;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Handlers only — mount under authenticated routes (e.g. `/api/v1/agent` or `/api/v1/potential-customers`). */
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

    if (req.userRole === "agent") {
      query = query.eq("assigned_agent_id", req.userId!);
    }

    if (negotiationStatus) query = query.eq("negotiation_status", negotiationStatus);

    const { data, count } = await query;
    return sendSuccess(res, { items: data ?? [], total: count ?? 0, page, limit });
  } catch (err) {
    return next(err);
  }
});

// GET /api/v1/potential-customers/:id — CRM profile bundle
potentialCustomerRoutes.get("/:id", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const pid = String(req.params.id);
    if (!UUID_RE.test(pid)) return next();

    const { data: lead, error } = await supabaseAdmin
      .from("potential_customers")
      .select("*, assigned_agent:users!assigned_agent_id(full_name, email, phone)")
      .eq("id", pid)
      .eq("tenant_id", req.tenantId!)
      .maybeSingle();

    if (error) throw error;
    if (!lead) return sendError(res, ERROR_CODES.NOT_FOUND, "Lead not found", 404);

    if (req.userRole === "agent" && lead.assigned_agent_id !== req.userId) {
      return sendError(res, ERROR_CODES.AUTH_FORBIDDEN, "Not your lead", 403);
    }

    const customerId = lead.customer_id as string | null;

    const [reservations, payments, documents, followUps, negotiations, activityRows] = await Promise.all([
      customerId
        ? supabaseAdmin
            .from("reservations")
            .select("id, status, total_price, created_at, units(unit_number)")
            .eq("tenant_id", req.tenantId!)
            .eq("customer_id", customerId)
            .order("created_at", { ascending: false })
            .limit(50)
        : Promise.resolve({ data: [] }),
      customerId
        ? supabaseAdmin
            .from("payments")
            .select("id, type, amount, status, due_date, paid_at")
            .eq("tenant_id", req.tenantId!)
            .eq("customer_id", customerId)
            .order("due_date", { ascending: false })
            .limit(100)
        : Promise.resolve({ data: [] }),
      customerId
        ? supabaseAdmin
            .from("documents")
            .select("id, type, status, created_at")
            .eq("tenant_id", req.tenantId!)
            .eq("user_id", customerId)
            .order("created_at", { ascending: false })
            .limit(50)
        : Promise.resolve({ data: [] }),
      supabaseAdmin
        .from("follow_ups")
        .select("*")
        .eq("tenant_id", req.tenantId!)
        .eq("potential_customer_id", pid)
        .order("scheduled_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("negotiations")
        .select("*, units(unit_number)")
        .eq("tenant_id", req.tenantId!)
        .eq("potential_customer_id", pid)
        .order("created_at", { ascending: false })
        .limit(50),
      (() => {
        let aq = supabaseAdmin
          .from("activity_logs")
          .select("id, action, entity_type, entity_id, details, created_at, user_id")
          .eq("tenant_id", req.tenantId!)
          .order("created_at", { ascending: false })
          .limit(40);
        if (customerId) {
          aq = aq.or(`entity_id.eq.${pid},entity_id.eq.${customerId}`);
        } else {
          aq = aq.eq("entity_id", pid);
        }
        return aq;
      })(),
    ]);

    return sendSuccess(res, {
      lead,
      reservations: reservations.data ?? [],
      payments: payments.data ?? [],
      documents: documents.data ?? [],
      follow_ups: followUps.data ?? [],
      negotiations: negotiations.data ?? [],
      activity: activityRows.data ?? [],
    });
  } catch (err) {
    return next(err);
  }
});

const patchLeadSchema = z.object({
  notes: z.string().max(8000).optional(),
  negotiation_status: z.enum(NEGOTIATION_STATUSES).optional(),
});

potentialCustomerRoutes.patch("/:id", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const pid = String(req.params.id);
    if (!UUID_RE.test(pid)) return next();

    const parsed = patchLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid input", 400, parsed.error.flatten());
    }

    let q = supabaseAdmin
      .from("potential_customers")
      .update({
        ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
        ...(parsed.data.negotiation_status !== undefined
          ? { negotiation_status: parsed.data.negotiation_status }
          : {}),
      })
      .eq("id", pid)
      .eq("tenant_id", req.tenantId!);

    if (req.userRole === "agent") q = q.eq("assigned_agent_id", req.userId!);

    const { data, error } = await q.select().maybeSingle();
    if (error) throw error;
    if (!data) return sendError(res, ERROR_CODES.NOT_FOUND, "Lead not found", 404);

    return sendSuccess(res, data);
  } catch (err) {
    return next(err);
  }
});

const leadSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().min(8),
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

    if (!isValidPhoneForTenant(phone, req.tenantCountryCode)) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid phone number for this region.", 400);
    }
    const phoneStored = normalizePhoneE164(phone, req.tenantCountryCode) ?? phone.trim();

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
        phone: phoneStored,
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
    const pid = String(req.params.id);
    if (!UUID_RE.test(pid)) return next();

    const parsed = patchStatusSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid status", 400);

    let q = supabaseAdmin
      .from("potential_customers")
      .update({ negotiation_status: parsed.data.negotiation_status })
      .eq("id", pid)
      .eq("tenant_id", req.tenantId!);

    if (req.userRole === "agent") q = q.eq("assigned_agent_id", req.userId!);

    const { data } = await q.select().maybeSingle();
    if (!data) return sendError(res, ERROR_CODES.NOT_FOUND, "Lead not found", 404);

    return sendSuccess(res, data);
  } catch (err) {
    return next(err);
  }
});

/** @deprecated Prefer PATCH /:id/negotiation-status with body `{ negotiation_status }`. */
potentialCustomerRoutes.patch("/:id/stage", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const pid = String(req.params.id);
    if (!UUID_RE.test(pid)) return next();

    const legacy = z.object({ stage: z.enum(NEGOTIATION_STATUSES) }).safeParse(req.body);
    if (!legacy.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid status", 400);

    let q = supabaseAdmin
      .from("potential_customers")
      .update({ negotiation_status: legacy.data.stage })
      .eq("id", pid)
      .eq("tenant_id", req.tenantId!);

    if (req.userRole === "agent") q = q.eq("assigned_agent_id", req.userId!);

    const { data } = await q.select().maybeSingle();
    if (!data) return sendError(res, ERROR_CODES.NOT_FOUND, "Lead not found", 404);

    return sendSuccess(res, data);
  } catch (err) {
    return next(err);
  }
});
