import type { Request } from "express";
import { rateLimit } from "express-rate-limit";
import type { AuthenticatedRequest } from "./auth";

/** Tenant-scoped key (slug/header/host) + IP — matches prior global limiter behavior. */
export function rateLimitTenantKey(req: Request): string {
  const slugFromHeader = String(req.headers["x-tenant-slug"] ?? "").trim().toLowerCase();
  const host = String(req.headers.host ?? "").toLowerCase();
  const subdomain = host.split(".")[0];
  const slugFromSubdomain =
    subdomain && !["www", "api", "localhost"].includes(subdomain) ? subdomain : "";
  const slugFromQuery = typeof req.query.tenant === "string" ? req.query.tenant.toLowerCase() : "";
  const tenantKey = slugFromHeader || slugFromSubdomain || slugFromQuery || "public";
  return `${tenantKey}:${req.ip ?? "unknown"}`;
}

export function tenantUserKey(req: Request): string {
  const uid = (req as AuthenticatedRequest).userId ?? "anon";
  return `${rateLimitTenantKey(req)}:u:${uid}`;
}

export const rateLimitJson = {
  ok: false as const,
  error: { code: "RATE_LIMITED", message: "Too many requests" },
};

export const limiter = rateLimit({ windowMs: 60_000, max: 300, keyGenerator: rateLimitTenantKey, validate: false });
export const authLimiter = rateLimit({ windowMs: 60_000, max: 10, keyGenerator: rateLimitTenantKey, validate: false });
export const publicLimiter = rateLimit({ windowMs: 60_000, max: 100, keyGenerator: rateLimitTenantKey, validate: false });
export const webhookLimiter = rateLimit({ windowMs: 60_000, max: 100, keyGenerator: rateLimitTenantKey, validate: false });

export const reservationLimiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  message: rateLimitJson,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "GET",
  keyGenerator: rateLimitTenantKey,
  validate: false,
});

export const waitlistLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: rateLimitJson,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "GET",
  keyGenerator: rateLimitTenantKey,
  validate: false,
});

export const uploadLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  message: rateLimitJson,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "GET",
  keyGenerator: rateLimitTenantKey,
  validate: false,
});

/** Public tenant signup — strict per-IP. */
export const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: rateLimitJson,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip ?? "unknown",
  validate: false,
});

/** Browser return URL after Paymob — per-IP burst control. */
export const platformConfirmReturnLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  message: rateLimitJson,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip ?? "unknown",
  validate: false,
});

/** Customer card pay-intent — per authenticated user + tenant scope. */
export const paymentIntentLimiter = rateLimit({
  windowMs: 60_000,
  max: 15,
  message: rateLimitJson,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: tenantUserKey,
  validate: false,
});

/** Schedule unit visit — per authenticated user + tenant scope. */
export const scheduleVisitLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: rateLimitJson,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: tenantUserKey,
  validate: false,
});
