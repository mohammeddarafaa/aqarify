import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./auth";
import { supabaseAdmin } from "../config/supabase";
import { sendError, ERROR_CODES } from "../utils/response";

export function requireFeature(featureKey: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return sendError(res, ERROR_CODES.TENANT_NOT_FOUND, "Tenant context required", 400);
    }

    const { data: tenant } = await supabaseAdmin
      .from("tenants")
      .select("enabled_features")
      .eq("id", tenantId)
      .maybeSingle();

    const features = Array.isArray(tenant?.enabled_features)
      ? tenant.enabled_features.map((f) => String(f))
      : [];

    if (!features.includes(featureKey)) {
      return sendError(
        res,
        ERROR_CODES.AUTH_FORBIDDEN,
        `Feature '${featureKey}' is not enabled for this tenant.`,
        403,
      );
    }

    return next();
  };
}
