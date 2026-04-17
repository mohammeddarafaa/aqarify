import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./auth";
import { supabaseAdmin } from "../config/supabase";
import { sendError } from "../utils/response";

export const SUBSCRIPTION_EXPIRED = "SUBSCRIPTION_EXPIRED";

// Blocks non-GET requests for tenants whose subscription has lapsed.
// Reads are always allowed so the public portal still renders in read-only mode.
export async function subscriptionGuard(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return next();
  }

  const tenantId = req.tenantId;
  if (!tenantId) return next();

  const { data: tenant } = await supabaseAdmin
    .from("tenants")
    .select("status")
    .eq("id", tenantId)
    .single();

  if (!tenant) return next();

  if (tenant.status === "read_only" || tenant.status === "pending_signup") {
    return sendError(
      res,
      SUBSCRIPTION_EXPIRED,
      "This tenant's subscription has expired. Please renew to resume writes.",
      402
    );
  }

  return next();
}
