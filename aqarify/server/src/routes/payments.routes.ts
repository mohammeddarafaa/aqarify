import { Router } from "express";
import { resolveTenant, type TenantRequest } from "../middleware/tenant";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { supabaseAdmin } from "../config/supabase";
import { sendSuccess, sendError, ERROR_CODES } from "../utils/response";

export const paymentRoutes = Router();
paymentRoutes.use(resolveTenant, authenticate);
const staffRoles = new Set(["agent", "manager", "admin", "super_admin"]);

// GET /api/v1/payments — customer payments
paymentRoutes.get("/", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const { data } = await supabaseAdmin.from("payments")
      .select("*, reservations(units(unit_number, type))")
      .eq("customer_id", req.userId!).eq("tenant_id", req.tenantId!)
      .order("due_date", { ascending: true });
    return sendSuccess(res, data ?? []);
  } catch (err) { return next(err); }
});

// GET /api/v1/payments/reservation/:reservationId
paymentRoutes.get("/reservation/:reservationId", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    let query = supabaseAdmin.from("payments")
      .select("*")
      .eq("reservation_id", req.params.reservationId)
      .eq("tenant_id", req.tenantId!)
      .order("due_date", { ascending: true });

    if (!staffRoles.has(req.userRole ?? "")) {
      query = query.eq("customer_id", req.userId!);
    }

    const { data } = await query;
    return sendSuccess(res, data ?? []);
  } catch (err) { return next(err); }
});

// GET /api/v1/payments/:id
paymentRoutes.get("/:id", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    let query = supabaseAdmin.from("payments")
      .select("*")
      .eq("id", req.params.id)
      .eq("tenant_id", req.tenantId!);

    if (!staffRoles.has(req.userRole ?? "")) {
      query = query.eq("customer_id", req.userId!);
    }

    const { data } = await query.single();
    if (!data) return sendError(res, "NOT_FOUND", "Payment not found", 404);
    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});
