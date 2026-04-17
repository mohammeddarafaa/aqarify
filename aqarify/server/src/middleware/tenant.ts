import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../config/supabase";
import { sendError, ERROR_CODES } from "../utils/response";

export interface TenantRequest extends Request {
  tenantId?: string;
  tenantSlug?: string;
}

export async function resolveTenant(
  req: TenantRequest,
  res: Response,
  next: NextFunction
) {
  // 1. From header (most reliable for API calls)
  const slugFromHeader = req.headers["x-tenant-slug"] as string | undefined;

  // 2. From subdomain
  const host = req.headers.host ?? "";
  const subdomain = host.split(".")[0];
  const slugFromSubdomain =
    subdomain && !["www", "api", "localhost"].includes(subdomain)
      ? subdomain
      : null;

  const slug = slugFromHeader ?? slugFromSubdomain;
  if (!slug) return next(); // Public routes without tenant context

  const { data: tenant, error } = await supabaseAdmin
    .from("tenants")
    .select("id, slug, status")
    .or(`slug.eq.${slug},custom_domain.eq.${host}`)
    .single();

  if (error || !tenant) {
    return sendError(res, ERROR_CODES.TENANT_NOT_FOUND, "Tenant not found", 404);
  }

  if (tenant.status === "suspended" || tenant.status === "pending_signup") {
    return sendError(res, ERROR_CODES.TENANT_SUSPENDED, "Tenant account is not active", 403);
  }
  // "read_only" and "active" both pass — subscriptionGuard blocks writes for read_only

  req.tenantId = tenant.id;
  req.tenantSlug = tenant.slug;
  return next();
}

export function requireTenant(req: TenantRequest, res: Response, next: NextFunction) {
  if (!req.tenantId) {
    return sendError(res, ERROR_CODES.TENANT_NOT_FOUND, "Tenant context required", 400);
  }
  return next();
}
