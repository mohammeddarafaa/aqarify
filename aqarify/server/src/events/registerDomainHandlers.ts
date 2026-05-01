import { onDomainEvent } from "./domainEventBus";
import { logger } from "../utils/logger";

let registered = false;

export function registerDomainHandlers() {
  if (registered) return;
  registered = true;

  onDomainEvent("reservation.confirmed", async (event) => {
    logger.info(`Event handled: reservation.confirmed (${event.aggregate_id})`);
  });

  onDomainEvent("reservation.cancelled", async (event) => {
    logger.info(`Event handled: reservation.cancelled (${event.aggregate_id})`);
  });

  onDomainEvent("waitlist.notified", async (event) => {
    logger.info(`Event handled: waitlist.notified (${event.aggregate_id})`);
  });
}
