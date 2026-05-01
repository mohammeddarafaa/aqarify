import { Router } from "express";
import { z } from "zod";
import { resolveTenant, requireTenant, type TenantRequest } from "../middleware/tenant";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { supabaseAdmin } from "../config/supabase";
import { sendSuccess, sendError, ERROR_CODES } from "../utils/response";

export const waitingListRoutes = Router();
waitingListRoutes.use(resolveTenant, authenticate, requireTenant);

const joinSchema = z.object({
  unit_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  preferred_type: z.string().optional(),
  preferred_floor: z.number().optional(),
  max_budget: z.number().positive().optional(),
  notes: z.string().optional(),
  notification_prefs: z.record(z.string(), z.unknown()).optional(),
});

// POST /api/v1/waiting-list — join
waitingListRoutes.post("/", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const parsed = joinSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid input", 400);
    }

    if (!parsed.data.unit_id && !parsed.data.project_id) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "unit_id or project_id required", 400);
    }

    if (!parsed.data.unit_id) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "unit_id required for waitlist", 400);
    }

    const { data: existing } = await supabaseAdmin
      .from("waiting_list")
      .select("id")
      .eq("customer_id", req.userId!)
      .eq("tenant_id", req.tenantId!)
      .eq("unit_id", parsed.data.unit_id)
      .in("status", ["waiting", "notified", "active"])
      .maybeSingle();

    if (existing) {
      return sendError(res, "ALREADY_ON_WAITLIST", "Already on waiting list for this unit", 409);
    }

    const { unit_id, notification_prefs, preferred_type, preferred_floor, max_budget, notes } =
      parsed.data;

    const { data, error } = await supabaseAdmin
      .from("waiting_list")
      .insert({
        tenant_id: req.tenantId!,
        customer_id: req.userId!,
        unit_id,
        preferred_type,
        preferred_floor,
        max_budget,
        notes,
        notification_prefs: notification_prefs ?? { sms: true, email: true },
        status: "waiting",
      })
      .select()
      .single();

    if (error) throw error;
    return sendSuccess(res, data, undefined, 201);
  } catch (err) {
    return next(err);
  }
});

// GET /api/v1/waiting-list/my — all entries for customer
waitingListRoutes.get("/my", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const { data } = await supabaseAdmin
      .from("waiting_list")
      .select("*, units(unit_number, type, projects(name))")
      .eq("customer_id", req.userId!)
      .eq("tenant_id", req.tenantId!)
      .not("status", "eq", "cancelled")
      .order("position", { ascending: true });
    return sendSuccess(res, data ?? []);
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/v1/waiting-list/my?unit_id= — leave one or all
waitingListRoutes.delete("/my", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const unitId = req.query.unit_id as string | undefined;
    let query = supabaseAdmin
      .from("waiting_list")
      .update({ status: "cancelled" })
      .eq("customer_id", req.userId!)
      .eq("tenant_id", req.tenantId!);
    if (unitId) query = query.eq("unit_id", unitId);
    await query;
    return sendSuccess(res, { removed: true });
  } catch (err) {
    return next(err);
  }
});
