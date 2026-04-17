import { Router } from "express";
import { z } from "zod";
import { resolveTenant, type TenantRequest } from "../middleware/tenant";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { supabaseAdmin } from "../config/supabase";
import { createReservation, confirmReservation, cancelReservation } from "../services/reservation.service";
import { requireRole } from "../middleware/rbac";
import { createPaymobIntention } from "../services/paymob.service";
import { decrypt } from "../utils/hmac";
import { sendSuccess, sendError, ERROR_CODES } from "../utils/response";

export const reservationRoutes = Router();
reservationRoutes.use(resolveTenant, authenticate);

const createSchema = z.object({
  unit_id: z.string().uuid(),
  payment_method: z.string(),
  full_name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email(),
  notes: z.string().optional(),
});

// POST /api/v1/reservations — create + initiate payment
reservationRoutes.post("/", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid input", 400, parsed.error.flatten());

    const { unit_id, payment_method, full_name, phone, email, notes } = parsed.data;

    // Get unit details
    const { data: unit } = await supabaseAdmin.from("units")
      .select("price, reservation_fee, status")
      .eq("id", unit_id)
      .eq("tenant_id", req.tenantId!)
      .single();

    if (!unit || unit.status !== "available") {
      return sendError(res, ERROR_CODES.UNIT_NOT_AVAILABLE, "Unit is not available", 409);
    }

    const reservation = await createReservation({
      tenantId: req.tenantId!, unitId: unit_id,
      customerId: req.userId!, totalPrice: unit.price,
      reservationFee: unit.reservation_fee, paymentMethod: payment_method, notes,
    });

    // If card payment — generate Paymob key
    if (payment_method === "card" || payment_method === "fawry" || payment_method === "vodafone_cash") {
      const { data: tenant } = await supabaseAdmin.from("tenants")
        .select("paymob_integration_id, paymob_api_key_enc, paymob_iframe_id")
        .eq("id", req.tenantId!)
        .single();

      if (!tenant?.paymob_integration_id || !tenant.paymob_api_key_enc) {
        return sendError(res, "PAYMOB_NOT_CONFIGURED", "Payment gateway not configured", 503);
      }

      const apiKey = decrypt(tenant.paymob_api_key_enc, process.env.ENCRYPTION_KEY!);
      const nameParts = full_name.split(" ");
      const { paymentKey } = await createPaymobIntention({
        apiKey, integrationId: tenant.paymob_integration_id,
        amountCents: Math.round(unit.reservation_fee * 100),
        currency: "EGP", orderId: reservation.id,
        billingData: { first_name: nameParts[0] ?? full_name, last_name: nameParts[1] ?? ".", email, phone_number: phone },
      });

      return sendSuccess(
        res,
        {
          reservation,
          payment_key: paymentKey,
          iframe_id: tenant.paymob_iframe_id ?? null,
          method: payment_method,
        },
        undefined,
        201,
      );
    }

    return sendSuccess(
      res,
      { reservation, payment_key: null, iframe_id: null, method: "bank_transfer" },
      undefined,
      201,
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNIT_NOT_AVAILABLE") {
      return sendError(res, ERROR_CODES.UNIT_NOT_AVAILABLE, "Unit is not available", 409);
    }
    return next(err);
  }
});

// GET /api/v1/reservations — customer's own reservations
reservationRoutes.get("/", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const { data } = await supabaseAdmin.from("reservations")
      .select(
        "*, units(unit_number, type, floor, size_sqm, gallery, projects(name)), assigned_agent:users!agent_id(full_name, phone)",
      )
      .eq("customer_id", req.userId!).eq("tenant_id", req.tenantId!)
      .order("created_at", { ascending: false });
    return sendSuccess(res, data ?? []);
  } catch (err) { return next(err); }
});

// GET /api/v1/reservations/:id/receipt — signed/public URL from storage path
reservationRoutes.get("/:id/receipt", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const { data } = await supabaseAdmin.from("reservations")
      .select("receipt_url, customer_id, tenant_id")
      .eq("id", String(req.params.id))
      .eq("tenant_id", req.tenantId!)
      .single();

    if (!data) return sendError(res, ERROR_CODES.RESERVATION_NOT_FOUND, "Not found", 404);

    const isOwner = data.customer_id === req.userId;
    const isStaff = ["agent", "manager", "admin", "super_admin"].includes(req.userRole ?? "");
    if (!isOwner && !isStaff) {
      return sendError(res, ERROR_CODES.AUTH_FORBIDDEN, "Access denied", 403);
    }

    if (!data.receipt_url) {
      return sendError(res, ERROR_CODES.NOT_FOUND, "Receipt not yet generated", 404);
    }

    return sendSuccess(res, { receipt_url: data.receipt_url });
  } catch (err) { return next(err); }
});

// GET /api/v1/reservations/:id
reservationRoutes.get("/:id", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    let query = supabaseAdmin.from("reservations")
      .select("*, units(*), users!customer_id(full_name, email, phone)")
      .eq("id", String(req.params.id))
      .eq("tenant_id", req.tenantId!);

    if (req.userRole === "customer") {
      query = query.eq("customer_id", req.userId!);
    }

    const { data } = await query.single();
    if (!data) return sendError(res, ERROR_CODES.RESERVATION_NOT_FOUND, "Not found", 404);
    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});

// POST /api/v1/reservations/:id/cancel
reservationRoutes.post("/:id/cancel", requireRole("manager", "admin", "agent"), async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const result = await cancelReservation(String(req.params.id), req.tenantId!, req.userId!);
    return sendSuccess(res, result);
  } catch (err) { return next(err); }
});

// POST /api/v1/reservations/:id/confirm — manual confirm (bank transfer)
reservationRoutes.post("/:id/confirm", requireRole("agent", "manager", "admin", "super_admin"), async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const { data: reservation } = await supabaseAdmin.from("reservations")
      .select("status, reservation_fee_paid")
      .eq("id", String(req.params.id))
      .eq("tenant_id", req.tenantId!)
      .single();
    if (!reservation) return sendError(res, ERROR_CODES.RESERVATION_NOT_FOUND, "Not found", 404);
    const confirmed = await confirmReservation(String(req.params.id), "manual", Number(reservation.reservation_fee_paid));
    return sendSuccess(res, confirmed);
  } catch (err) { return next(err); }
});
