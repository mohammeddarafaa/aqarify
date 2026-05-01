import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../config/supabase";
import { sendError, ERROR_CODES } from "../utils/response";
import { logger } from "../utils/logger";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
  tenantId?: string;
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return sendError(res, ERROR_CODES.AUTH_REQUIRED, "Authentication required", 401);
  }

  const token = authHeader.slice(7);
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return sendError(res, ERROR_CODES.AUTH_INVALID_TOKEN, "Invalid or expired token", 401);
  }

  // Fetch user profile with role
  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("role, tenant_id, is_active")
    .eq("id", data.user.id)
    .single();

  if (!profile?.is_active) {
    return sendError(res, ERROR_CODES.AUTH_FORBIDDEN, "User account is disabled", 403);
  }

  req.userId = data.user.id;
  req.userRole = profile?.role;

  const resolvedByHeader = req.tenantId;
  const userTenantId = profile?.tenant_id ?? undefined;

  if (
    resolvedByHeader &&
    userTenantId &&
    resolvedByHeader !== userTenantId &&
    profile?.role !== "super_admin"
  ) {
    return sendError(res, ERROR_CODES.AUTH_FORBIDDEN, "Cross-tenant access denied", 403);
  }

  if (profile?.role === "super_admin") {
    req.tenantId = resolvedByHeader ?? userTenantId;
    if (resolvedByHeader && resolvedByHeader !== userTenantId) {
      await supabaseAdmin.from("activity_logs").insert({
        tenant_id: resolvedByHeader,
        user_id: data.user.id,
        action: "super_admin_cross_tenant_access",
        entity_type: "tenant",
        entity_id: resolvedByHeader,
        details: {
          requested_tenant_id: resolvedByHeader,
          original_tenant_id: userTenantId ?? null,
          path: req.path,
          method: req.method,
        },
        ip_address: req.ip,
      }).then(({ error: auditError }) => {
        if (auditError) logger.warn("Failed to write super_admin access audit log", auditError);
      });
    }
  } else {
    req.tenantId = userTenantId ?? resolvedByHeader;
  }

  return next();
}

export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return next();

  const token = authHeader.slice(7);
  supabaseAdmin.auth.getUser(token).then(({ data }) => {
    if (data.user) req.userId = data.user.id;
    next();
  }).catch(() => next());
}
