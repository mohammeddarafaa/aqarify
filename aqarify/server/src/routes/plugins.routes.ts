import { Router } from "express";
import { z } from "zod";
import { resolveTenant, requireTenant, type TenantRequest } from "../middleware/tenant";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { requirePlugin } from "../middleware/requirePlugin";
import { supabaseAdmin } from "../config/supabase";
import { listPlugins, hasPluginKey } from "../plugins/pluginRegistry";
import { sendError, sendSuccess, ERROR_CODES } from "../utils/response";

export const pluginRoutes = Router();
pluginRoutes.use(resolveTenant, authenticate, requireTenant);

pluginRoutes.get("/", requireRole("admin", "super_admin"), async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const { data: enabled } = await supabaseAdmin
      .from("tenant_plugins")
      .select("plugin_key, is_enabled, config")
      .eq("tenant_id", req.tenantId!);

    const byKey = new Map((enabled ?? []).map((r) => [r.plugin_key, r]));
    const payload = listPlugins().map((plugin) => ({
      ...plugin,
      is_enabled: byKey.get(plugin.key)?.is_enabled ?? false,
      config: byKey.get(plugin.key)?.config ?? {},
    }));
    return sendSuccess(res, payload);
  } catch (err) {
    return next(err);
  }
});

const patchPluginSchema = z.object({
  is_enabled: z.boolean(),
  config: z.record(z.string(), z.unknown()).optional(),
});

pluginRoutes.patch("/:pluginKey", requireRole("admin", "super_admin"), async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const pluginKey = String(req.params.pluginKey);
    if (!hasPluginKey(pluginKey)) {
      return sendError(res, ERROR_CODES.NOT_FOUND, "Plugin not found", 404);
    }
    const parsed = patchPluginSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid plugin payload", 400);
    }

    const { data, error } = await supabaseAdmin
      .from("tenant_plugins")
      .upsert({
        tenant_id: req.tenantId!,
        plugin_key: pluginKey,
        is_enabled: parsed.data.is_enabled,
        config: parsed.data.config ?? {},
        updated_at: new Date().toISOString(),
      })
      .select("plugin_key, is_enabled, config")
      .single();

    if (error) throw error;
    return sendSuccess(res, data);
  } catch (err) {
    return next(err);
  }
});

pluginRoutes.post(
  "/crm-export/run",
  requireRole("agent", "manager", "admin", "super_admin"),
  requirePlugin("crm_export"),
  async (req: TenantRequest & AuthenticatedRequest, res, next) => {
    try {
      const [leads, reservations] = await Promise.all([
        supabaseAdmin
          .from("potential_customers")
          .select("id, name, phone, email, negotiation_status, created_at")
          .eq("tenant_id", req.tenantId!)
          .order("created_at", { ascending: false })
          .limit(200),
        supabaseAdmin
          .from("reservations")
          .select("id, status, total_price, created_at")
          .eq("tenant_id", req.tenantId!)
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      return sendSuccess(res, {
        exported_at: new Date().toISOString(),
        tenant_id: req.tenantId,
        leads: leads.data ?? [],
        reservations: reservations.data ?? [],
      });
    } catch (err) {
      return next(err);
    }
  },
);
