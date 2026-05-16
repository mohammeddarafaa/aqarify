/**
 * T3-A — Sentry Integration
 *
 * SERVER SETUP (add to server/src/index.ts BEFORE routes):
 * ─────────────────────────────────────────────────────────
 *
 *   import * as Sentry from "@sentry/node";
 *   import { nodeProfilingIntegration } from "@sentry/profiling-node";
 *
 *   Sentry.init({
 *     dsn: process.env.SENTRY_DSN,
 *     environment: process.env.NODE_ENV ?? "development",
 *     integrations: [nodeProfilingIntegration()],
 *     tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
 *   });
 *
 *   // Add BEFORE routes:
 *   app.use(Sentry.Handlers.requestHandler());
 *   app.use(Sentry.Handlers.tracingHandler());
 *
 *   // Add BEFORE errorHandler (but after routes):
 *   app.use(Sentry.Handlers.errorHandler());
 *
 *
 * SERVER ERROR HANDLER UPDATE (server/src/middleware/errorHandler.ts):
 * ────────────────────────────────────────────────────────────────────
 * Tag Sentry events with reqId + tenantId so traces are correlatable with logs.
 *
 *   import * as Sentry from "@sentry/node";
 *   import { requestStore } from "./requestId";
 *
 *   export function errorHandler(err, req, res, _next) {
 *     const reqId = requestStore.getStore()?.reqId ?? "unknown";
 *     const tenantId = (req as TenantRequest).tenantId ?? "none";
 *     Sentry.withScope((scope) => {
 *       scope.setTag("reqId", reqId);
 *       scope.setTag("tenantId", tenantId);
 *       Sentry.captureException(err);
 *     });
 *     logger.error(err.message, { stack: err.stack, reqId });
 *     res.status(500).json({
 *       ok: false,
 *       error: { code: "INTERNAL_ERROR", message: "حدث خطأ غير متوقع" },
 *     });
 *   }
 *
 *
 * CLIENT SETUP (client/src/main.tsx):
 * ────────────────────────────────────
 *
 *   import * as Sentry from "@sentry/react";
 *   import { browserTracingIntegration } from "@sentry/react";
 *
 *   Sentry.init({
 *     dsn: import.meta.env.VITE_SENTRY_DSN,
 *     environment: import.meta.env.MODE,
 *     integrations: [browserTracingIntegration()],
 *     tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
 *   });
 *
 *
 * ROUTE ERROR BOUNDARY (client/src/components/shared/route-error-boundary.tsx):
 * ─────────────────────────────────────────────────────────────────────────────
 * Add inside catch block:
 *
 *   import * as Sentry from "@sentry/react";
 *   // ...
 *   useEffect(() => {
 *     if (error) Sentry.captureException(error);
 *   }, [error]);
 *
 *
 * PACKAGES TO INSTALL:
 * ─────────────────────
 *   # Server
 *   npm install @sentry/node @sentry/profiling-node --workspace=server
 *
 *   # Client
 *   npm install @sentry/react --workspace=client
 */

export {};  // This file is documentation-only; see comments above.
