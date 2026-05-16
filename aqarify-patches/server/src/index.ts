import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";
import { requestIdMiddleware } from "./middleware/requestId";
import { authRoutes } from "./routes/auth.routes";
import { tenantRoutes } from "./routes/tenants.routes";
import { unitRoutes } from "./routes/units.routes";
import { projectRoutes } from "./routes/projects.routes";
import { reservationRoutes } from "./routes/reservations.routes";
import { waitingListRoutes } from "./routes/waitingList.routes";
import { paymentRoutes } from "./routes/payments.routes";
import { notificationRoutes } from "./routes/notifications.routes";
import { webhookRoutes } from "./routes/webhooks.routes";
import { agentRoutes } from "./routes/agent.routes";
import { managerRoutes } from "./routes/manager.routes";
import { adminRoutes } from "./routes/admin.routes";
import { documentRoutes } from "./routes/documents.routes";
import { activityLogRoutes } from "./routes/activityLogs.routes";
import { reportRoutes } from "./routes/reports.routes";
import { negotiationRoutes } from "./routes/negotiations.routes";
import { potentialCustomerRoutes } from "./routes/potentialCustomers.routes";
import { planRoutes } from "./routes/plans.routes";
import { platformSubscriptionRoutes } from "./routes/platformSubscription.routes";
import { subscriptionGuard } from "./middleware/subscriptionGuard";
import { resolveTenant } from "./middleware/tenant";
import { authenticate } from "./middleware/auth";
import { requireRole } from "./middleware/rbac";
import { attachTenantRegionHeaders } from "./middleware/tenantRegionHeaders";
import { startPaymentReminderCron } from "./jobs/paymentReminders";
import { startWaitlistTimerCron } from "./jobs/waitlistTimer";
import { startDailySummaryCron } from "./jobs/dailySummary";
import { startSubscriptionExpiryCron } from "./jobs/subscriptionExpiry";
import { parseEncryptionKeyVersions } from "./utils/hmac";
import {
  limiter,
  authLimiter,
  publicLimiter,
  webhookLimiter,
  reservationLimiter,
  waitlistLimiter,
  uploadLimiter,
} from "./middleware/rateLimiters";
import { supabaseAdmin } from "./config/supabase";
import { pluginRoutes } from "./routes/plugins.routes";
import { platformAdminRoutes } from "./routes/platformAdmin.routes";
import { registerDomainHandlers } from "./events/registerDomainHandlers";
import { startDomainEventDispatcher, stopDomainEventDispatcher } from "./events/domainEventBus";
import { favoriteRoutes } from "./routes/favorites.routes";

// ─── T1-E: Startup environment validation ────────────────────────────────────
function validateEnv() {
  const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    logger.error(`Missing required env vars: ${missing.join(", ")}`);
    process.exit(1);
  }
  if (!process.env.ENCRYPTION_KEY && !process.env.ENCRYPTION_KEYS) {
    logger.error("Set ENCRYPTION_KEY (32 chars) or ENCRYPTION_KEYS (e.g. v1:32-char-key)");
    process.exit(1);
  }
  try {
    const versions = parseEncryptionKeyVersions();
    for (const [label, key] of Object.entries(versions)) {
      if (key.length !== 32) {
        logger.error(
          `Encryption key ${label} must be exactly 32 characters. Got: ${key.length}`,
        );
        process.exit(1);
      }
    }
  } catch (e) {
    logger.error("Invalid encryption key configuration", e);
    process.exit(1);
  }
  logger.info("Environment validation passed");
}

validateEnv();

const app = express();
const PORT = process.env.PORT ?? 4000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
const corsDomainCache = new Map<string, { allowed: boolean; expiresAt: number }>();
const CORS_CACHE_MS = 5 * 60 * 1000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? process.env.CLIENT_URL ?? "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const rootDomain = process.env.ROOT_DOMAIN ?? "localhost";

app.use(helmet());
app.use(
  cors({
    origin: async (origin, callback) => {
      if (!origin) return callback(null, true);
      try {
        const url = new URL(origin);
        const host = url.host.toLowerCase();
        const now = Date.now();

        const cached = corsDomainCache.get(host);
        if (cached && cached.expiresAt > now) {
          if (cached.allowed) return callback(null, origin);
          return callback(new Error("Not allowed by CORS"));
        }

        const fromAllowlist = allowedOrigins.some((o) => origin === o);
        const fromPlatformSubdomain =
          rootDomain !== "localhost" && host.endsWith(`.${rootDomain}`);

        let fromCustomDomain = false;
        if (!fromAllowlist && !fromPlatformSubdomain) {
          const result = await supabaseAdmin
            .from("tenants")
            .select("id")
            .eq("custom_domain", host)
            .in("status", ["active", "trial", "read_only"])
            .maybeSingle();
          fromCustomDomain = !!result.data?.id;
        }

        const ok = fromAllowlist || fromPlatformSubdomain || fromCustomDomain;
        corsDomainCache.set(host, { allowed: ok, expiresAt: now + CORS_CACHE_MS });
        if (!ok) return callback(new Error("Not allowed by CORS"));
        return callback(null, origin);
      } catch {
        return callback(new Error("Invalid CORS origin"));
      }
    },
    credentials: true,
  }),
);

// ─── T2-E: Request ID — MUST be first middleware ──────────────────────────────
app.use(requestIdMiddleware);

// ─── Rate limiters ────────────────────────────────────────────────────────────
app.use("/webhooks", webhookLimiter);
app.use("/api/v1/auth", authLimiter);
app.use("/api/v1/favorites", authLimiter);
app.use("/api/v1/units", publicLimiter);
app.use("/api/v1/projects", publicLimiter);
app.use("/api/v1/reservations", reservationLimiter);
app.use("/api/v1/waiting-list", waitlistLimiter);
app.use("/api/v1/documents", uploadLimiter);
app.use("/api", limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(attachTenantRegionHeaders);

// ─── T2-A: Health & readiness endpoints ──────────────────────────────────────
// /health — no DB call; used by Docker HEALTHCHECK and Railway health probe
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "aqarify-api", version: "1.0.0", ts: Date.now() });
});

// /ready — verifies DB connectivity; returns 503 if unreachable
app.get("/ready", async (_req, res) => {
  try {
    const { error } = await supabaseAdmin.from("tenants").select("id").limit(1);
    if (error) throw error;
    res.json({ status: "ready" });
  } catch (err) {
    logger.warn("Readiness check failed", err);
    res.status(503).json({ status: "not_ready" });
  }
});

// ─── Routes — public ─────────────────────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/favorites", favoriteRoutes);
app.use("/api/v1/tenants", tenantRoutes);
app.use("/api/v1/plans", planRoutes);
app.use("/api/v1", platformSubscriptionRoutes);
app.use("/api/v1/platform-admin", platformAdminRoutes);
app.use("/webhooks", webhookRoutes);

// ─── Routes — subscription-guarded ───────────────────────────────────────────
app.use("/api/v1/units", unitRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/reservations", reservationRoutes);
app.use("/api/v1/waiting-list", waitingListRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/documents", documentRoutes);
app.use("/api/v1/activity-logs", activityLogRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/negotiations", negotiationRoutes);
app.use("/api/v1/agent", agentRoutes);
app.use(
  "/api/v1/potential-customers",
  resolveTenant,
  subscriptionGuard,
  authenticate,
  requireRole("agent", "manager", "admin", "super_admin"),
  potentialCustomerRoutes,
);
app.use("/api/v1/manager", managerRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/plugins", pluginRoutes);

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Server startup ───────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  logger.info(`Aqarify API running on port ${PORT}`);
  registerDomainHandlers();
  startDomainEventDispatcher();
  if (process.env.ENABLE_CRONS !== "false" && process.env.CRON_PROCESS_ROLE !== "api") {
    startPaymentReminderCron();
    startWaitlistTimerCron();
    startDailySummaryCron();
    startSubscriptionExpiryCron();
    logger.info("All cron jobs started");
  }
});

// ─── T2-B: Graceful shutdown ──────────────────────────────────────────────────
const SHUTDOWN_TIMEOUT_MS = 30_000;

function gracefulShutdown(signal: string) {
  logger.info(`${signal} received — starting graceful shutdown`);

  // Stop accepting new connections immediately
  server.close(() => {
    logger.info("HTTP server closed");
  });

  // Stop the domain event dispatcher and any cron interval handles
  stopDomainEventDispatcher();

  // Force-exit if shutdown takes too long (e.g. a hung request)
  const forceTimer = setTimeout(() => {
    logger.error("Graceful shutdown timed out — forcing exit");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceTimer.unref(); // don't block Node's event loop

  // Allow in-flight requests to complete; process.exit called by server.close cb
  server.closeAllConnections?.(); // Node ≥ 18.2
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default app;
