import { supabaseAdmin } from "../config/supabase";
import { logger } from "../utils/logger";

export interface DomainEvent<TPayload = Record<string, unknown>> {
  tenantId?: string;
  eventType: string;
  aggregateType?: string;
  aggregateId?: string;
  payload: TPayload;
}

type Handler = (event: {
  id: string;
  tenant_id: string | null;
  event_type: string;
  aggregate_type: string | null;
  aggregate_id: string | null;
  payload: Record<string, unknown>;
}) => Promise<void>;

const handlers = new Map<string, Handler[]>();
let dispatcherStarted = false;
let dispatcherTimer: NodeJS.Timeout | null = null;

export function onDomainEvent(eventType: string, handler: Handler) {
  const list = handlers.get(eventType) ?? [];
  list.push(handler);
  handlers.set(eventType, list);
}

export async function emitDomainEvent(event: DomainEvent): Promise<void> {
  const { error } = await supabaseAdmin.from("domain_events").insert({
    tenant_id: event.tenantId ?? null,
    event_type: event.eventType,
    aggregate_type: event.aggregateType ?? null,
    aggregate_id: event.aggregateId ?? null,
    payload: event.payload,
    status: "pending",
  });
  if (error) {
    logger.error(`Failed to persist domain event ${event.eventType}`, error);
  }
}

async function processPendingEvents(limit = 50): Promise<void> {
  const { data: events } = await supabaseAdmin
    .from("domain_events")
    .select("id, tenant_id, event_type, aggregate_type, aggregate_id, payload")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);

  for (const event of events ?? []) {
    const eventHandlers = handlers.get(event.event_type) ?? [];
    if (eventHandlers.length === 0) {
      await supabaseAdmin
        .from("domain_events")
        .update({ status: "processed", processed_at: new Date().toISOString() })
        .eq("id", event.id);
      continue;
    }

    try {
      for (const handler of eventHandlers) {
        await handler(event);
      }
      await supabaseAdmin
        .from("domain_events")
        .update({ status: "processed", processed_at: new Date().toISOString() })
        .eq("id", event.id);
    } catch (err) {
      logger.error(`Domain event handler failed (${event.event_type})`, err);
      await supabaseAdmin
        .from("domain_events")
        .update({ status: "failed" })
        .eq("id", event.id);
    }
  }
}

export function startDomainEventDispatcher() {
  if (dispatcherStarted) return;
  dispatcherStarted = true;
  dispatcherTimer = setInterval(() => {
    processPendingEvents().catch((err) => logger.error("Domain event dispatcher failed", err));
  }, 3000);
  logger.info("Domain event dispatcher started");
}

export function stopDomainEventDispatcher() {
  if (dispatcherTimer) clearInterval(dispatcherTimer);
  dispatcherTimer = null;
  dispatcherStarted = false;
}
