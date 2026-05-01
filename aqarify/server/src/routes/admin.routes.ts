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
      .select(
        "id,name,slug,logo_url,favicon_url,theme_config,filter_schema,contact_email,contact_phone,address,social_links,bank_name,bank_account_number,bank_account_holder,currency,currency_symbol,country_code,email_from_address,email_from_name,sms_sender_name,notification_templates,receipt_footer_text,receipt_primary_color",
      )
      .eq("id", req.tenantId!).single();
    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const themeConfigSchema = z.object({
  primary_color: hexColor,
  secondary_color: hexColor,
  accent_color: hexColor,
  font_family: z.string().max(60),
  radius_base: z.string().max(32).optional(),
  shadow_depth: z.string().max(32).optional(),
  spacing_scale: z.string().max(32).optional(),
  font_scale: z.string().max(32).optional(),
});

const filterDefinitionSchema = z.object({
  key: z.string().max(50).regex(/^[a-z0-9_]+$/),
  label: z.string().max(100),
  type: z.enum(["dropdown", "range", "checkbox"]),
  options: z.array(z.string().max(100)).optional(),
  default: z.string().optional(),
});

const filterSchemaSchema = z.object({
  filters: z.array(filterDefinitionSchema).max(20),
  has_search: z.boolean(),
  has_map_view: z.boolean(),
  has_clear_button: z.boolean(),
});

const tenantUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  logo_url: z.string().url().optional(),
  favicon_url: z.string().url().optional(),
  primary_color: hexColor.optional(),
  secondary_color: hexColor.optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
  social_links: z.record(z.string(), z.string()).optional(),
  theme_config: themeConfigSchema.optional(),
  filter_schema: filterSchemaSchema.optional(),
  bank_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  bank_account_holder: z.string().optional(),
  email_from_address: z.string().email().optional(),
  email_from_name: z.string().max(120).optional(),
  sms_sender_name: z.string().max(11).optional(),
  notification_templates: z.record(z.string(), z.object({
    title: z.string().optional(),
    body: z.string().optional(),
  })).optional(),
  receipt_footer_text: z.string().max(300).optional(),
  receipt_primary_color: hexColor.optional(),
});

// PATCH /api/v1/admin/tenant — update settings
adminRoutes.patch("/tenant", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const parsed = tenantUpdateSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid input", 400, parsed.error.flatten());

    const b = parsed.data;
    const patch: Record<string, unknown> = {};

    const simple: (keyof typeof b)[] = [
      "name", "logo_url", "favicon_url", "contact_email", "contact_phone", "address", "social_links",
      "bank_name", "bank_account_number", "bank_account_holder", "email_from_address", "email_from_name",
      "sms_sender_name", "notification_templates", "receipt_footer_text", "receipt_primary_color",
    ];
    for (const k of simple) {
      if (b[k] !== undefined) patch[k] = b[k];
    }

    if (b.filter_schema !== undefined) {
      const f = filterSchemaSchema.safeParse(b.filter_schema);
      if (!f.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid filter_schema", 400, f.error.flatten());
      patch.filter_schema = f.data;
    }

    if (b.theme_config !== undefined) {
      const t = themeConfigSchema.safeParse(b.theme_config);
      if (!t.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid theme_config", 400, t.error.flatten());
      patch.theme_config = t.data;
    } else if (b.primary_color !== undefined || b.secondary_color !== undefined) {
      const { data: existing } = await supabaseAdmin.from("tenants")
        .select("theme_config")
        .eq("id", req.tenantId!)
        .single();
      const tc = (existing?.theme_config as Record<string, string> | null) ?? {};
      const merged = {
        ...tc,
        ...(b.primary_color ? { primary_color: b.primary_color } : {}),
        ...(b.secondary_color ? { secondary_color: b.secondary_color } : {}),
      };
      const t = themeConfigSchema.safeParse(merged);
      if (!t.success) {
        return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid theme_config after merge", 400, t.error.flatten());
      }
      patch.theme_config = t.data;
    }

    const { data, error } = await supabaseAdmin.from("tenants")
      .update(patch as never).eq("id", req.tenantId!).select().single();

    if (error) throw error;
    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});

// PATCH /api/v1/admin/tenant/paymob — update Paymob credentials
const paymobSchema = z.object({
  api_key: z.string().min(10),
  integration_id: z.string().min(1),
  iframe_id: z.string().min(1, "iFrame ID is required for card payments"),
  /** Paymob dashboard HMAC; stored encrypted. Omit to leave existing secret unchanged. */
  hmac_secret: z.string().min(8).optional(),
});

adminRoutes.patch("/tenant/paymob", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const parsed = paymobSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid input", 400);

    const apiKeyEnc = encrypt(parsed.data.api_key);
    const patch: Record<string, unknown> = {
      paymob_api_key_enc: apiKeyEnc,
      paymob_integration_id: parsed.data.integration_id,
      paymob_iframe_id: parsed.data.iframe_id,
    };
    if (parsed.data.hmac_secret?.trim()) {
      patch.paymob_hmac_secret_enc = encrypt(parsed.data.hmac_secret.trim());
    }

    const { data } = await supabaseAdmin.from("tenants").update(patch as never).eq("id", req.tenantId!).select("id").single();

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
