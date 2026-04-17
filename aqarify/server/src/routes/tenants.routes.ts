import { Router } from "express";
import { supabaseAdmin } from "../config/supabase";
import { sendSuccess, sendError, ERROR_CODES } from "../utils/response";

export const tenantRoutes = Router();

// GET /api/v1/tenants/by-slug/:slug
tenantRoutes.get("/by-slug/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { data, error } = await supabaseAdmin
      .from("tenants")
      .select(
        "id, name, slug, logo_url, favicon_url, theme_config, filter_schema, contact_phone, contact_email, address, status"
      )
      .eq("slug", slug)
      .in("status", ["active", "read_only"])
      .single();

    if (error || !data) {
      return sendError(res, ERROR_CODES.TENANT_NOT_FOUND, "Tenant not found", 404);
    }
    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});
