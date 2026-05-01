import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./auth";
import { supabaseAdmin } from "../config/supabase";
import { sendError, ERROR_CODES } from "../utils/response";

export function requirePlugin(pluginKey: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return sendError(res, ERROR_CODES.TENANT_NOT_FOUND, "Tenant context required", 400);
    }

    const { data } = await supabaseAdmin
      .from("tenant_plugins")
      .select("is_enabled")
      .eq("tenant_id", tenantId)
      .eq("plugin_key", pluginKey)
      .maybeSingle();

    if (!data?.is_enabled) {
      return sendError(
        res,
        ERROR_CODES.AUTH_FORBIDDEN,
        `Plugin '${pluginKey}' is disabled for this tenant.`,
        403,
      );
    }

    return next();
  };
}
