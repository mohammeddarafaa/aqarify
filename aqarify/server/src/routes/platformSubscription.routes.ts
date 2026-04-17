import { Router, type Response } from "express";
import { z } from "zod";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { supabaseAdmin } from "../config/supabase";
import { sendSuccess, sendError, ERROR_CODES } from "../utils/response";
import {
  createTenantSignup,
  getCurrentSubscription,
  cancelSubscription,
  changeSubscriptionPlan,
  activateSubscription,
} from "../services/subscription.service";
import { createPlatformPayment } from "../services/platformPaymob.service";
import { paymobReturnFlatToHmacPayload, verifyPaymobHmac } from "../utils/hmac";
import { logger } from "../utils/logger";

export const platformSubscriptionRoutes = Router();

const signupSchema = z.object({
  company_name: z.string().min(2).max(120),
  slug: z.string().min(3).max(40).regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, digits, and hyphens"),
  admin_email: z.string().email(),
  admin_phone: z.string().min(8).max(20),
  admin_first_name: z.string().min(1).max(60),
  admin_last_name: z.string().min(1).max(60),
  plan_code: z.enum(["starter", "growth", "pro"]),
  billing_cycle: z.enum(["monthly", "yearly"]),
});
const changePlanSchema = z.object({
  plan_code: z.enum(["starter", "growth", "pro"]),
  billing_cycle: z.enum(["monthly", "yearly"]).optional(),
});

const confirmPlatformReturnSchema = z.object({
  subscription_id: z.string().uuid(),
  paymob: z.record(z.string(), z.string()),
});

// POST /api/v1/subscription/confirm-platform-return (public)
// When Paymob redirects the browser to our app, we get a signed query string.
// That works on localhost even if the server webhook URL is not reachable.
// Webhooks remain the canonical path in production; this is HMAC-verified the same way.
platformSubscriptionRoutes.post("/subscription/confirm-platform-return", async (req, res, next) => {
  try {
    const parsed = confirmPlatformReturnSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid payload", 400, {
        issues: parsed.error.issues,
      });
    }
    const { subscription_id, paymob } = parsed.data;
    const secret = process.env.AQARIFY_PAYMOB_HMAC_SECRET ?? "";
    if (!secret) {
      return sendError(res, ERROR_CODES.PAYMENT_FAILED, "Platform Paymob HMAC not configured", 500);
    }
    const hmac = paymob.hmac ?? "";
    const payload = paymobReturnFlatToHmacPayload(paymob);
    if (!verifyPaymobHmac(payload as Record<string, unknown>, hmac, secret)) {
      logger.warn("Platform return-url HMAC mismatch");
      return sendError(res, ERROR_CODES.PAYMENT_HMAC_INVALID, "Invalid payment signature", 401);
    }
    if (String(payload.success).toLowerCase() !== "true") {
      return sendSuccess(res, { activated: false });
    }
    const merchantOrder = paymob.merchant_order_id ?? "";
    if (!merchantOrder || merchantOrder !== subscription_id) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Subscription reference does not match payment", 400);
    }
    const txId = String(payload.id ?? "");
    const amountEgp = Number(payload.amount_cents ?? 0) / 100;
    await activateSubscription(subscription_id, txId, amountEgp);
    return sendSuccess(res, { activated: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "confirm failed";
    if (msg === "SUBSCRIPTION_NOT_FOUND") {
      return sendError(res, ERROR_CODES.NOT_FOUND, "Subscription not found", 404);
    }
    return next(err);
  }
});

// POST /api/v1/signup  (public)
platformSubscriptionRoutes.post("/signup", async (req, res, next) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid signup payload", 400, {
        issues: parsed.error.issues,
      });
    }
    const result = await createTenantSignup(parsed.data);
    return sendSuccess(res, result, undefined, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "signup failed";
    if (msg === "SLUG_TAKEN") {
      return sendError(res, "SLUG_TAKEN", "This slug is already in use", 409);
    }
    if (msg === "PLAN_NOT_FOUND") {
      return sendError(res, ERROR_CODES.NOT_FOUND, "Plan not found", 404);
    }
    return next(err);
  }
});

// GET /api/v1/signup/check-slug/:slug  (public)
platformSubscriptionRoutes.get("/signup/check-slug/:slug", async (req, res, next) => {
  try {
    const { data } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("slug", req.params.slug)
      .maybeSingle();
    return sendSuccess(res, { available: !data });
  } catch (err) {
    return next(err);
  }
});

// GET /api/v1/subscription/status/:id  (public, post-checkout polling)
// The subscription UUID acts as a one-time read token for the newly signed-up
// user. Returns only `status` + `tenant_slug` so the post-checkout page can
// redirect once the Paymob webhook activates the tenant.
platformSubscriptionRoutes.get("/subscription/status/:id", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("tenant_subscriptions")
      .select("status, tenant:tenants(slug, status)")
      .eq("id", req.params.id)
      .single();
    if (error || !data) {
      return sendError(res, ERROR_CODES.NOT_FOUND, "Subscription not found", 404);
    }
    const tenant = data.tenant as unknown as { slug: string; status: string } | null;
    const tenantReady = tenant && (tenant.status === "active" || tenant.status === "read_only");
    return sendSuccess(res, {
      status: data.status,
      tenant_slug: tenantReady ? tenant.slug : null,
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/v1/subscription/me  (admin)
platformSubscriptionRoutes.get(
  "/subscription/me",
  authenticate,
  requireRole("admin", "super_admin"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      if (!req.tenantId) {
        return sendError(res, ERROR_CODES.TENANT_NOT_FOUND, "No tenant context", 400);
      }
      const sub = await getCurrentSubscription(req.tenantId);
      return sendSuccess(res, sub);
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/v1/subscription/renew  (admin)
platformSubscriptionRoutes.post(
  "/subscription/renew",
  authenticate,
  requireRole("admin", "super_admin"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      if (!req.tenantId || !req.userId) {
        return sendError(res, ERROR_CODES.AUTH_REQUIRED, "Tenant context missing", 400);
      }
      const current = await getCurrentSubscription(req.tenantId);
      if (!current) {
        return sendError(res, ERROR_CODES.NOT_FOUND, "No subscription found", 404);
      }

      const { data: user } = await supabaseAdmin
        .from("users")
        .select("full_name, email, phone")
        .eq("id", req.userId)
        .single();

      const nameParts = (user?.full_name ?? "Admin").split(" ");
      const first = nameParts[0] ?? "Admin";
      const last = nameParts.slice(1).join(" ") || "User";

      const paymob = await createPlatformPayment({
        amountEGP: Number(current.amount_egp),
        merchantOrderId: current.id,
        billingData: {
          first_name: first,
          last_name: last,
          email: user?.email ?? "admin@example.com",
          phone_number: user?.phone ?? "+200000000000",
        },
      });

      await supabaseAdmin
        .from("tenant_subscriptions")
        .update({
          paymob_order_id: paymob.paymobOrderId,
          paymob_payment_key: paymob.paymentKey,
          updated_at: new Date().toISOString(),
        })
        .eq("id", current.id);

      return sendSuccess(res, { iframeUrl: paymob.iframeUrl, subscriptionId: current.id });
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/v1/subscription/cancel  (admin)
platformSubscriptionRoutes.post(
  "/subscription/cancel",
  authenticate,
  requireRole("admin", "super_admin"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      if (!req.tenantId) {
        return sendError(res, ERROR_CODES.TENANT_NOT_FOUND, "No tenant context", 400);
      }
      const result = await cancelSubscription(req.tenantId);
      return sendSuccess(res, result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "cancel failed";
      if (msg === "NO_ACTIVE_SUBSCRIPTION") {
        return sendError(res, ERROR_CODES.NOT_FOUND, "No active subscription", 404);
      }
      return next(err);
    }
  }
);

// POST /api/v1/subscription/change-plan  (admin)
platformSubscriptionRoutes.post(
  "/subscription/change-plan",
  authenticate,
  requireRole("admin", "super_admin"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      if (!req.tenantId) {
        return sendError(res, ERROR_CODES.TENANT_NOT_FOUND, "No tenant context", 400);
      }
      const parsed = changePlanSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid input", 400, {
          issues: parsed.error.issues,
        });
      }
      const result = await changeSubscriptionPlan({
        tenantId: req.tenantId,
        planCode: parsed.data.plan_code,
        billingCycle: parsed.data.billing_cycle,
      });
      return sendSuccess(res, result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "plan change failed";
      if (msg === "NO_SUBSCRIPTION") {
        return sendError(res, ERROR_CODES.NOT_FOUND, "No subscription found", 404);
      }
      if (msg === "PLAN_NOT_FOUND") {
        return sendError(res, ERROR_CODES.NOT_FOUND, "Plan not found", 404);
      }
      return next(err);
    }
  }
);

// GET /api/v1/subscription/invoices  (admin)
platformSubscriptionRoutes.get(
  "/subscription/invoices",
  authenticate,
  requireRole("admin", "super_admin"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      if (!req.tenantId) {
        return sendError(res, ERROR_CODES.TENANT_NOT_FOUND, "No tenant context", 400);
      }
      const { data, error } = await supabaseAdmin
        .from("platform_payments")
        .select("id, amount_egp, currency, status, paymob_transaction_id, paid_at, created_at")
        .eq("tenant_id", req.tenantId)
        .order("created_at", { ascending: false });
      if (error) return sendError(res, ERROR_CODES.INTERNAL_ERROR, error.message, 500);
      return sendSuccess(res, data ?? []);
    } catch (err) {
      return next(err);
    }
  }
);
