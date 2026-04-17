import { Router } from "express";
import { z } from "zod";
import { resolveTenant, type TenantRequest } from "../middleware/tenant";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { supabaseAdmin } from "../config/supabase";
import { encrypt } from "../utils/hmac";
import { sendSuccess, sendError, ERROR_CODES } from "../utils/response";

export const adminRoutes = Router();
adminRoutes.use(resolveTenant, authenticate, requireRole("admin", "super_admin"));

// GET /api/v1/admin/tenant — get tenant settings
adminRoutes.get("/tenant", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const { data } = await supabaseAdmin.from("tenants")
      .select("id,name,slug,logo_url,primary_color,secondary_color,contact_email,contact_phone,address,social_links,filter_schema")
      .eq("id", req.tenantId!).single();
    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});

const tenantUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  logo_url: z.string().url().optional(),
  primary_color: z.string().optional(),
  secondary_color: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
  social_links: z.record(z.string(), z.string()).optional(),
  filter_schema: z.array(z.unknown()).optional(),
});

// PATCH /api/v1/admin/tenant — update settings
adminRoutes.patch("/tenant", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const parsed = tenantUpdateSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid input", 400, parsed.error.flatten());

    const { data, error } = await supabaseAdmin.from("tenants")
      .update(parsed.data).eq("id", req.tenantId!).select().single();

    if (error) throw error;
    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});

// PATCH /api/v1/admin/tenant/paymob — update Paymob credentials
const paymobSchema = z.object({
  api_key: z.string().min(10),
  integration_id: z.string().min(1),
  iframe_id: z.string().optional(),
});

adminRoutes.patch("/tenant/paymob", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const parsed = paymobSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid input", 400);

    const apiKeyEnc = encrypt(parsed.data.api_key, process.env.ENCRYPTION_KEY!);
    const { data } = await supabaseAdmin.from("tenants").update({
      paymob_api_key_enc: apiKeyEnc, paymob_integration_id: parsed.data.integration_id,
      paymob_iframe_id: parsed.data.iframe_id,
    }).eq("id", req.tenantId!).select("id").single();

    return sendSuccess(res, { updated: true, id: data?.id });
  } catch (err) { return next(err); }
});

// GET /api/v1/admin/users — all users in tenant
adminRoutes.get("/users", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const role = req.query.role as string | undefined;
    let query = supabaseAdmin.from("users")
      .select("id, full_name, email, phone, role, created_at", { count: "exact" })
      .eq("tenant_id", req.tenantId!).order("created_at", { ascending: false });

    if (role) query = query.eq("role", role);
    const { data, count } = await query;
    return sendSuccess(res, { items: data ?? [], total: count ?? 0 });
  } catch (err) { return next(err); }
});

// PATCH /api/v1/admin/users/:id/role
adminRoutes.patch("/users/:id/role", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const schema = z.object({ role: z.enum(["customer", "agent", "manager", "admin"]) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid role", 400);

    const { data } = await supabaseAdmin.from("users")
      .update({ role: parsed.data.role }).eq("id", req.params.id)
      .eq("tenant_id", req.tenantId!).select().single();

    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});

// DELETE /api/v1/admin/users/:id — disable user
adminRoutes.delete("/users/:id", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    await supabaseAdmin.from("users")
      .update({ is_active: false }).eq("id", req.params.id).eq("tenant_id", req.tenantId!);
    return sendSuccess(res, { disabled: true });
  } catch (err) { return next(err); }
});
