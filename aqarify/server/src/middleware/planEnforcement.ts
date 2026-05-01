import type { NextFunction, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import type { AuthenticatedRequest } from "./auth";
import { sendError, ERROR_CODES } from "../utils/response";

type Entity = "units" | "projects" | "users";

const COLUMN_BY_ENTITY: Record<Entity, string> = {
  units: "max_units",
  projects: "max_projects",
  users: "max_users",
};

async function getTenantPlanLimits(tenantId: string): Promise<Record<string, number> | null> {
  const nowIso = new Date().toISOString();
  const { data: sub } = await supabaseAdmin
    .from("tenant_subscriptions")
    .select("plan_id, status, current_period_end")
    .eq("tenant_id", tenantId)
    .in("status", ["active", "past_due"])
    .order("current_period_end", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (!sub) return null;
  if (sub.current_period_end && sub.current_period_end < nowIso) return null;

  const { data: plan } = await supabaseAdmin
    .from("subscription_plans")
    .select("max_units, max_projects, max_users")
    .eq("id", sub.plan_id)
    .maybeSingle();

  return (plan as Record<string, number> | null) ?? null;
}

async function currentUsage(tenantId: string, entity: Entity): Promise<number> {
  if (entity === "users") {
    const { count } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("is_active", true);
    return count ?? 0;
  }

  const { count } = await supabaseAdmin
    .from(entity)
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);
  return count ?? 0;
}

export function enforcePlanLimit(entity: Entity) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
      return next();
    }

    const tenantId = req.tenantId;
    if (!tenantId) return next();

    const limits = await getTenantPlanLimits(tenantId);
    if (!limits) return next();

    const max = limits[COLUMN_BY_ENTITY[entity]];
    if (typeof max !== "number" || max <= 0) return next();

    const used = await currentUsage(tenantId, entity);
    if (used >= max) {
      return sendError(
        res,
        ERROR_CODES.AUTH_FORBIDDEN,
        `Plan limit reached for ${entity}. Upgrade your plan to continue.`,
        402,
        { entity, used, max },
      );
    }

    return next();
  };
}
