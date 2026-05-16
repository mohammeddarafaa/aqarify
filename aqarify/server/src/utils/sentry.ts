import * as Sentry from "@sentry/node";
import { logger } from "./logger";

/**
 * Initializes Sentry if SENTRY_DSN is provided.
 * Should be called at the very beginning of the application startup.
 */
export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.info("Sentry not initialized: SENTRY_DSN missing");
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 1.0,
  });

  logger.info("Sentry initialized successfully");
}

/**
 * Global error reporting utility.
 */
export function reportError(err: unknown, context?: object) {
  logger.error(String(err), context);
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err, { extra: context });
  }
}
