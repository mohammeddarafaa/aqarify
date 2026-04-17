import { Router } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../config/supabase";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { resolveTenant, type TenantRequest } from "../middleware/tenant";
import { sendSuccess, sendError, ERROR_CODES } from "../utils/response";

export const authRoutes = Router();

// GET /api/v1/auth/me — fetch current user profile
authRoutes.get("/me", authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, role, tenant_id, avatar_url, phone")
      .eq("id", req.userId!)
      .single();

    if (error || !data) {
      return sendError(res, ERROR_CODES.AUTH_REQUIRED, "User not found", 404);
    }
    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});

// POST /api/v1/auth/complete-profile — update phone after signup
const profileSchema = z.object({ phone: z.string().min(10) });

authRoutes.post("/complete-profile", authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid input", 400);
    }
    await supabaseAdmin
      .from("users")
      .update({ phone: parsed.data.phone })
      .eq("id", req.userId!);

    return sendSuccess(res, { updated: true });
  } catch (err) { return next(err); }
});

// POST /api/v1/auth/logout
authRoutes.post("/logout", authenticate, async (_req, res, next) => {
  try {
    return sendSuccess(res, { message: "Logged out" });
  } catch (err) { return next(err); }
});

// GET /api/v1/auth/session — validate token and return tenant context
authRoutes.get("/session", authenticate, resolveTenant, async (
  req: AuthenticatedRequest & TenantRequest, res, next
) => {
  try {
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, role, tenant_id, avatar_url, phone")
      .eq("id", req.userId!)
      .single();

    return sendSuccess(res, { user, tenant_id: req.tenantId });
  } catch (err) { return next(err); }
});
