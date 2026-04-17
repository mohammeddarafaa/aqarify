import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../config/supabase";
import { sendError, ERROR_CODES } from "../utils/response";

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
    .select("role, tenant_id")
    .eq("id", data.user.id)
    .single();

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
