import { Router } from "express";
import { supabaseAdmin } from "../config/supabase";
import { sendSuccess, sendError, ERROR_CODES } from "../utils/response";

export const tenantRoutes = Router();

/** Public-safe columns only (never paymob_*_enc / API secrets). */
const TENANT_BY_SLUG_SELECT_MIN = [
  "id",
  "name",
  "slug",
  "logo_url",
  "favicon_url",
  "theme_config",
  "filter_schema",
  "contact_phone",
  "contact_email",
  "address",
  "status",
  "bank_name",
  "bank_account_number",
  "bank_account_holder",
].join(", ");

const TENANT_BY_SLUG_SELECT_FULL = [
  TENANT_BY_SLUG_SELECT_MIN,
  "currency",
  "currency_symbol",
  "country_code",
  "map_center_lat",
  "map_center_lng",
  "map_zoom",
  "payment_gateway",
].join(", ");

// GET /api/v1/tenants/by-slug/:slug
tenantRoutes.get("/by-slug/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const statusFilter = ["active", "read_only", "trial"] as const;

    let { data, error } = await supabaseAdmin
      .from("tenants")
      .select(TENANT_BY_SLUG_SELECT_FULL)
      .eq("slug", slug)
      // Include `trial` so new tenants (DB default status) resolve on the public portal.
      // `pending_signup` stays excluded: row exists before SaaS payment clears (see migration 00023).
      .in("status", [...statusFilter])
      .single();

    // Older databases missing later migrations (e.g. currency columns) make the whole SELECT fail.
    if (error?.code === "42703") {
      ({ data, error } = await supabaseAdmin
        .from("tenants")
        .select(TENANT_BY_SLUG_SELECT_MIN)
        .eq("slug", slug)
        .in("status", [...statusFilter])
        .single());
    }

    if (error || !data) {
      return sendError(res, ERROR_CODES.TENANT_NOT_FOUND, "Tenant not found", 404);
    }
    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});
