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
      .select("id, email, full_name, role, tenant_id, avatar_url, phone, tenants(slug)")
      .eq("id", req.userId!)
      .single();

    if (error || !data) {
      return sendError(res, ERROR_CODES.AUTH_REQUIRED, "User not found", 404);
    }
    const row = data as {
      id: string;
      email: string;
      full_name: string;
      role: string;
      tenant_id: string | null;
      avatar_url: string | null;
      phone: string | null;
      tenants: { slug: string } | { slug: string }[] | null;
    };
    const embed = row.tenants;
    const tenant_slug = Array.isArray(embed)
      ? (embed[0]?.slug ?? null)
      : (embed?.slug ?? null);
    return sendSuccess(res, {
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      role: row.role,
      tenant_id: row.tenant_id,
      avatar_url: row.avatar_url,
      phone: row.phone,
      tenant_slug,
    });
  } catch (err) { return next(err); }
});

// PATCH /api/v1/auth/profile — update user profile
const updateProfileSchema = z.object({
  full_name: z.string().optional(),
  phone: z.string().optional(),
  avatar_url: z.string().optional(),
});

authRoutes.patch("/profile", authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid input", 400);
    }
    const { error } = await supabaseAdmin
      .from("users")
      .update(parsed.data)
      .eq("id", req.userId!);

    if (error) return sendError(res, ERROR_CODES.INTERNAL_ERROR, error.message, 500);
    return sendSuccess(res, { updated: true });
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
authRoutes.get("/session", resolveTenant, authenticate, async (
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
