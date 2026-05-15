import { Router } from "express";
import { resolveTenant, requireTenant, type TenantRequest } from "../middleware/tenant";
import { subscriptionGuard } from "../middleware/subscriptionGuard";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { supabaseAdmin } from "../config/supabase";
import { sendSuccess, sendError, ERROR_CODES } from "../utils/response";
import {
  createTenantCardPaymentIntent,
  type TenantCardGatewayRow,
} from "../services/cardPaymentIntent.service";
import { backfillMissingPaymentSchedulesForCustomer } from "../services/reservation.service";
import { cardPaymentsEnabledForTenant } from "../services/paymentGateway.factory";
import { paymentIntentLimiter } from "../middleware/rateLimiters";

export const paymentRoutes = Router();
paymentRoutes.use(resolveTenant, subscriptionGuard, authenticate, requireTenant);
const staffRoles = new Set(["agent", "manager", "admin", "super_admin"]);

// POST /api/v1/payments/:id/pay-intent — Paymob for an installment (before GET /:id)
paymentRoutes.post("/:id/pay-intent", paymentIntentLimiter, async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("*, users!customer_id(full_name, email, phone)")
      .eq("id", req.params.id)
      .eq("tenant_id", req.tenantId!)
      .eq("customer_id", req.userId!)
      .single();

    if (!payment) return sendError(res, "NOT_FOUND", "Payment not found", 404);
    if (!["pending", "overdue"].includes(payment.status)) {
      return sendError(res, "ALREADY_PAID", "Payment is not payable", 409);
    }

    const { data: tenant } = await supabaseAdmin
      .from("tenants")
      .select("paymob_integration_id, paymob_api_key_enc, paymob_iframe_id, currency, payment_gateway, country_code")
      .eq("id", req.tenantId!)
      .single();

    if (!cardPaymentsEnabledForTenant((tenant as { payment_gateway?: string })?.payment_gateway)) {
      return sendError(
        res,
        ERROR_CODES.VALIDATION_ERROR,
        "Online card payment is not enabled for this workspace.",
        400,
      );
    }

    if (!tenant?.paymob_integration_id || !tenant.paymob_api_key_enc) {
      return sendError(res, "PAYMOB_NOT_CONFIGURED", "Payment gateway not configured", 503);
    }
    if (!tenant.paymob_iframe_id?.trim()) {
      return sendError(res, "PAYMOB_NOT_CONFIGURED", "Payment gateway not fully configured (missing iFrame ID)", 503);
    }

    const customer = payment.users as { full_name: string; email: string; phone: string | null };
    const nameParts = customer.full_name.split(" ");

    const { paymentKey } = await createTenantCardPaymentIntent({
      tenant: tenant as TenantCardGatewayRow,
      amountCents: Math.round(Number(payment.amount) * 100),
      orderId: payment.id,
      billingData: {
        first_name: nameParts[0] ?? customer.full_name,
        last_name: nameParts[1] ?? ".",
        email: customer.email,
        phone_number: customer.phone ?? "",
      },
    });

    return sendSuccess(res, {
      payment_key: paymentKey,
      iframe_id: tenant.paymob_iframe_id ?? null,
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/v1/payments — customer payments
paymentRoutes.get("/", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    if (req.userRole === "customer" && req.userId && req.tenantId) {
      await backfillMissingPaymentSchedulesForCustomer(req.userId, req.tenantId);
    }
    const { data } = await supabaseAdmin.from("payments")
      .select("*, reservations(units(unit_number, type))")
      .eq("customer_id", req.userId!).eq("tenant_id", req.tenantId!)
      .order("due_date", { ascending: true });
    return sendSuccess(res, data ?? []);
  } catch (err) { return next(err); }
});

// GET /api/v1/payments/reservation/:reservationId
paymentRoutes.get("/reservation/:reservationId", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    let query = supabaseAdmin.from("payments")
      .select("*")
      .eq("reservation_id", req.params.reservationId)
      .eq("tenant_id", req.tenantId!)
      .order("due_date", { ascending: true });

    if (!staffRoles.has(req.userRole ?? "")) {
      query = query.eq("customer_id", req.userId!);
    }

    const { data } = await query;
    return sendSuccess(res, data ?? []);
  } catch (err) { return next(err); }
});

// GET /api/v1/payments/:id
paymentRoutes.get("/:id", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    let query = supabaseAdmin.from("payments")
      .select("*")
      .eq("id", req.params.id)
      .eq("tenant_id", req.tenantId!);

    if (!staffRoles.has(req.userRole ?? "")) {
      query = query.eq("customer_id", req.userId!);
    }

    const { data } = await query.single();
    if (!data) return sendError(res, "NOT_FOUND", "Payment not found", 404);
    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});
