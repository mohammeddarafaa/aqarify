import { Router } from "express";
import { resolveTenant, type TenantRequest } from "../middleware/tenant";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { supabaseAdmin } from "../config/supabase";
import { sendSuccess } from "../utils/response";

export const activityLogRoutes = Router();
activityLogRoutes.use(resolveTenant, authenticate, requireRole("manager", "admin"));

// GET /api/v1/activity-logs
activityLogRoutes.get("/", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const page = parseInt(String(req.query.page ?? "1"));
    const limit = Math.min(parseInt(String(req.query.limit ?? "50")), 200);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin.from("activity_logs")
      .select("*, users!user_id(full_name, role, email)", { count: "exact" })
      .eq("tenant_id", req.tenantId!)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (req.query.user_id) query = query.eq("user_id", String(req.query.user_id));
    if (req.query.action) query = query.eq("action", String(req.query.action));
    if (req.query.entity_type) query = query.eq("entity_type", String(req.query.entity_type));
    if (req.query.from) query = query.gte("created_at", String(req.query.from));
    if (req.query.to) query = query.lte("created_at", String(req.query.to));

    const { data, count } = await query;
    return sendSuccess(res, data ?? [], { page, limit, total: count ?? 0 });
  } catch (err) { return next(err); }
});

// Helper to log activity (exported for use in other routes)
export async function logActivity(
  tenantId: string,
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  details?: Record<string, unknown>,
  ipAddress?: string
) {
  await supabaseAdmin.from("activity_logs").insert({
    tenant_id: tenantId,
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details: details ?? {},
    ip_address: ipAddress,
  }).then(({ error }) => {
    if (error) {
      // Silently fail — don't break main flow
    }
  });
}
