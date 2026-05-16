import { Router } from "express";
import { z } from "zod";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { supabaseAdmin } from "../config/supabase";
import { sendSuccess, sendError, ERROR_CODES } from "../utils/response";

export const platformAdminRoutes = Router();
platformAdminRoutes.use(authenticate, requireRole("super_admin"));

// GET /api/v1/platform-admin/tenants
// Returns all tenants with plan, status, and last_activity_at
platformAdminRoutes.get("/tenants", async (_req: AuthenticatedRequest, res, next) => {
  try {
    const { data: tenants, error } = await supabaseAdmin
      .from("tenants")
      .select(
        `id, name, slug, status, created_at, contact_email, contact_phone,
         tenant_subscriptions(plan_id, status, current_period_end)`,
      )
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) throw error;

    // Enrich with last reservation activity
    const enriched = await Promise.all(
      (tenants ?? []).map(async (t) => {
        const { data: lastEvent } = await supabaseAdmin
          .from("reservations")
          .select("created_at")
          .eq("tenant_id", t.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          ...t,
          last_activity_at: lastEvent?.created_at ?? null,
        };
      }),
    );

    return sendSuccess(res, enriched);
  } catch (err) {
    return next(err);
  }
});

// GET /api/v1/platform-admin/metrics
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

// PATCH /api/v1/platform-admin/tenants/:tenantId/status
// Suspend or activate a tenant
const statusSchema = z.object({
  status: z.enum(["active", "suspended", "trial", "read_only"]),
  reason: z.string().optional(),
});

platformAdminRoutes.patch(
  "/tenants/:tenantId/status",
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const parsed = statusSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid status", 400);
      }

      const { status, reason } = parsed.data;

      const { data, error } = await supabaseAdmin
        .from("tenants")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", req.params.tenantId)
        .select("id, name, status")
        .maybeSingle();

      if (error) throw error;
      if (!data) return sendError(res, ERROR_CODES.NOT_FOUND, "Tenant not found", 404);

      return sendSuccess(res, { ...data, reason });
    } catch (err) {
      return next(err);
    }
  },
);

// GET /api/v1/platform-admin/tenants/:tenantId/impersonation-context
platformAdminRoutes.get(
  "/tenants/:tenantId/impersonation-context",
  async (req: AuthenticatedRequest, res, next) => {
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
  },
);
