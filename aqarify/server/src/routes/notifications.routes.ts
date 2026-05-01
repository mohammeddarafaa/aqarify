import { Router } from "express";
import { resolveTenant, requireTenant, type TenantRequest } from "../middleware/tenant";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { supabaseAdmin } from "../config/supabase";
import { sendSuccess } from "../utils/response";

export const notificationRoutes = Router();
notificationRoutes.use(resolveTenant, authenticate, requireTenant);

// GET /api/v1/notifications
notificationRoutes.get("/", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const { data, count } = await supabaseAdmin.from("notifications")
      .select("*", { count: "exact" }).eq("user_id", req.userId!)
      .eq("tenant_id", req.tenantId!).order("created_at", { ascending: false }).limit(50);
    return sendSuccess(res, { items: data ?? [], total: count ?? 0 });
  } catch (err) { return next(err); }
});

// GET /api/v1/notifications/unread-count
notificationRoutes.get("/unread-count", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const { count } = await supabaseAdmin.from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", req.userId!).eq("tenant_id", req.tenantId!).eq("is_read", false);
    return sendSuccess(res, { count: count ?? 0 });
  } catch (err) { return next(err); }
});

// POST /api/v1/notifications/mark-all-read
notificationRoutes.post("/mark-all-read", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    await supabaseAdmin.from("notifications")
      .update({ is_read: true }).eq("user_id", req.userId!).eq("tenant_id", req.tenantId!);
    return sendSuccess(res, { done: true });
  } catch (err) { return next(err); }
});

// PATCH /api/v1/notifications/:id/read
notificationRoutes.patch("/:id/read", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    await supabaseAdmin.from("notifications")
      .update({ is_read: true }).eq("id", req.params.id).eq("user_id", req.userId!);
    return sendSuccess(res, { done: true });
  } catch (err) { return next(err); }
});
