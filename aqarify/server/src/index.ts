import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";
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
import { startPaymentReminderCron } from "./jobs/paymentReminders";
import { startWaitlistTimerCron } from "./jobs/waitlistTimer";
import { startDailySummaryCron } from "./jobs/dailySummary";
import { startSubscriptionExpiryCron } from "./jobs/subscriptionExpiry";
import { parseEncryptionKeyVersions } from "./utils/hmac";

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
        logger.error(`Encryption key ${label} must be exactly 32 characters. Got: ${key.length}`);
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

app.use(helmet());
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? process.env.CLIENT_URL ?? "http://localhost:3000").split(",").map((s) => s.trim()).filter(Boolean);
const rootDomain = process.env.ROOT_DOMAIN ?? "localhost";

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const ok =
        allowedOrigins.some((o) => origin === o) ||
        (rootDomain !== "localhost" && origin.endsWith(`.${rootDomain}`));
      if (!ok) return callback(new Error("Not allowed by CORS"));
      return callback(null, origin);
    },
    credentials: true,
  }),
);

const limiter = rateLimit({ windowMs: 60_000, max: 300 });
const authLimiter = rateLimit({ windowMs: 60_000, max: 10 });
const publicLimiter = rateLimit({ windowMs: 60_000, max: 100 });
const webhookLimiter = rateLimit({ windowMs: 60_000, max: 100 });
const rateJson = { ok: false as const, error: { code: "RATE_LIMITED", message: "Too many requests" } };
const reservationLimiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  message: rateJson,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "GET",
});
const waitlistLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: rateJson,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "GET",
});
const uploadLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  message: rateJson,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "GET",
});
app.use("/webhooks", webhookLimiter);
app.use("/api/v1/auth", authLimiter);
app.use("/api/v1/units", publicLimiter);
app.use("/api/v1/projects", publicLimiter);
app.use("/api/v1/reservations", reservationLimiter);
app.use("/api/v1/waiting-list", waitlistLimiter);
app.use("/api/v1/documents", uploadLimiter);
app.use("/api", limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes — public (no subscription guard needed)
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/tenants", tenantRoutes);
app.use("/api/v1/plans", planRoutes);
app.use("/api/v1", platformSubscriptionRoutes); // /signup + /subscription/*
app.use("/webhooks", webhookRoutes);

// Routes — guarded by subscription status (writes blocked for expired tenants)
app.use("/api/v1/units", subscriptionGuard, unitRoutes);
app.use("/api/v1/projects", subscriptionGuard, projectRoutes);
app.use("/api/v1/reservations", subscriptionGuard, reservationRoutes);
app.use("/api/v1/waiting-list", subscriptionGuard, waitingListRoutes);
app.use("/api/v1/payments", subscriptionGuard, paymentRoutes);
app.use("/api/v1/notifications", subscriptionGuard, notificationRoutes);
app.use("/api/v1/documents", subscriptionGuard, documentRoutes);
app.use("/api/v1/activity-logs", subscriptionGuard, activityLogRoutes);
app.use("/api/v1/reports", subscriptionGuard, reportRoutes);
app.use("/api/v1/negotiations", subscriptionGuard, negotiationRoutes);
app.use("/api/v1/agent", subscriptionGuard, agentRoutes);
app.use(
  "/api/v1/potential-customers",
  subscriptionGuard,
  resolveTenant,
  authenticate,
  requireRole("agent", "manager", "admin", "super_admin"),
  potentialCustomerRoutes,
);
app.use("/api/v1/manager", subscriptionGuard, managerRoutes);
app.use("/api/v1/admin", subscriptionGuard, adminRoutes);

// Health check + sitemap hint
app.get("/health", (_req, res) => res.json({ ok: true, service: "aqarify-api", version: "1.0.0" }));

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Aqarify API running on port ${PORT}`);
  // Start cron jobs
  if (process.env.ENABLE_CRONS !== "false") {
    startPaymentReminderCron();
    startWaitlistTimerCron();
    startDailySummaryCron();
    startSubscriptionExpiryCron();
    logger.info("All cron jobs started");
  }
});

export default app;
