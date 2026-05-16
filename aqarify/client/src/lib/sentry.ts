import * as Sentry from "@sentry/react";

/**
 * Initializes Sentry on the client side if VITE_SENTRY_DSN is provided.
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    console.log("Sentry not initialized: VITE_SENTRY_DSN missing");
    return;
  }

  Sentry.init({
    dsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
  });

  console.log("Sentry client initialized successfully");
}
