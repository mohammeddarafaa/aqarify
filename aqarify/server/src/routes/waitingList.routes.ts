import { Router } from "express";
import { z } from "zod";
import { resolveTenant, type TenantRequest } from "../middleware/tenant";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { supabaseAdmin } from "../config/supabase";
import { sendSuccess, sendError, ERROR_CODES } from "../utils/response";

export const waitingListRoutes = Router();
waitingListRoutes.use(resolveTenant, authenticate);

const joinSchema = z.object({
  unit_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  preferred_type: z.string().optional(),
  preferred_floor: z.number().optional(),
  max_budget: z.number().positive().optional(),
  notes: z.string().optional(),
});

// POST /api/v1/waiting-list — join
waitingListRoutes.post("/", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const parsed = joinSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid input", 400);

    if (!parsed.data.unit_id && !parsed.data.project_id) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "unit_id or project_id required", 400);
    }

    // Check for duplicate
    const { data: existing } = await supabaseAdmin.from("waiting_list")
      .select("id").eq("customer_id", req.userId!)
      .eq("tenant_id", req.tenantId!).maybeSingle();

    if (existing) return sendError(res, "ALREADY_ON_WAITLIST", "Already on waiting list", 409);

    const { count } = await supabaseAdmin.from("waiting_list")
      .select("*", { count: "exact", head: true }).eq("tenant_id", req.tenantId!);

    const { data, error } = await supabaseAdmin.from("waiting_list").insert({
      tenant_id: req.tenantId!, customer_id: req.userId!,
      ...parsed.data, position: (count ?? 0) + 1, status: "waiting",
    }).select().single();

    if (error) throw error;
    return sendSuccess(res, data, undefined, 201);
  } catch (err) { return next(err); }
});

// GET /api/v1/waiting-list/my — customer's own entry
waitingListRoutes.get("/my", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const { data } = await supabaseAdmin.from("waiting_list")
      .select("*, units(unit_number, type), projects(name)")
      .eq("customer_id", req.userId!).eq("tenant_id", req.tenantId!).maybeSingle();
    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});

// DELETE /api/v1/waiting-list/my — leave
waitingListRoutes.delete("/my", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    await supabaseAdmin.from("waiting_list")
      .update({ status: "cancelled" })
      .eq("customer_id", req.userId!).eq("tenant_id", req.tenantId!);
    return sendSuccess(res, { removed: true });
  } catch (err) { return next(err); }
});
