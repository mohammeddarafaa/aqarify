import { supabaseAdmin } from "../config/supabase";
import { logger } from "../utils/logger";

export async function logActivity(params: {
  tenantId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
}): Promise<void> {
  const { error } = await supabaseAdmin.from("activity_logs").insert({
    tenant_id: params.tenantId,
    user_id: params.userId ?? null,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    details: params.details ?? {},
    ip_address: params.ipAddress ?? null,
  });
  if (error) {
    logger.warn("activity_logs insert failed", error);
  }
}
