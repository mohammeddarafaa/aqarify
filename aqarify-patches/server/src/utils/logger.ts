import winston from "winston";
import { requestStore } from "../middleware/requestId";

/**
 * Winston logger with automatic reqId injection from AsyncLocalStorage.
 *
 * Every log line emitted during an HTTP request will carry the `reqId` field
 * so log aggregators (Datadog, Loki, CloudWatch) can trace the full lifecycle
 * of a single request across services.
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  format: winston.format.combine(
    // Inject reqId from the active async context (no-op outside request scope)
    winston.format((info) => {
      const ctx = requestStore.getStore();
      if (ctx?.reqId) {
        info["reqId"] = ctx.reqId;
      }
      return info;
    })(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === "production"
      ? winston.format.json()
      : winston.format.prettyPrint(),
  ),
  transports: [new winston.transports.Console()],
});
