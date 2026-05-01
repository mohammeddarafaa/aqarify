import { Router } from "express";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { supabaseAdmin } from "../config/supabase";
import { sendSuccess } from "../utils/response";

export const platformAdminRoutes = Router();
platformAdminRoutes.use(authenticate, requireRole("super_admin"));

platformAdminRoutes.get("/tenants", async (_req: AuthenticatedRequest, res, next) => {
  try {
    const { data: tenants } = await supabaseAdmin
      .from("tenants")
      .select("id, name, slug, status, created_at, contact_email, contact_phone")
      .order("created_at", { ascending: false })
      .limit(500);

    return sendSuccess(res, tenants ?? []);
  } catch (err) {
    return next(err);
  }
});

platformAdminRoutes.get("/metrics", async (_req: AuthenticatedRequest, res, next) => {
  try {
    const [tenantsCount, usersCount, reservationsCount] = await Promise.all([
      supabaseAdmin.from("tenants").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("users").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("reservations").select("*", { count: "exact", head: true }),
    ]);

    return sendSuccess(res, {
      tenants: tenantsCount.count ?? 0,
      users: usersCount.count ?? 0,
      reservations: reservationsCount.count ?? 0,
      collected_at: new Date().toISOString(),
    });
  } catch (err) {
    return next(err);
  }
});

platformAdminRoutes.get("/tenants/:tenantId/impersonation-context", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data: tenant } = await supabaseAdmin
      .from("tenants")
      .select("id, slug, name, status")
      .eq("id", req.params.tenantId)
      .maybeSingle();

    const { data: adminUser } = await supabaseAdmin
      .from("users")
      .select("id, full_name, email, role")
      .eq("tenant_id", req.params.tenantId)
      .in("role", ["admin", "manager"])
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    return sendSuccess(res, {
      tenant,
      suggested_user: adminUser ?? null,
      hint: tenant ? `Use x-tenant-slug=${tenant.slug} with support tooling` : null,
    });
  } catch (err) {
    return next(err);
  }
});
