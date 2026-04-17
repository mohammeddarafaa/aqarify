import { Router } from "express";
import { supabaseAdmin } from "../config/supabase";
import { sendSuccess, sendError, ERROR_CODES } from "../utils/response";

export const planRoutes = Router();

// GET /api/v1/plans — public list of active subscription plans
planRoutes.get("/", async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("subscription_plans")
      .select("id, code, name, description, price_egp_monthly, price_egp_yearly, max_units, max_users, max_projects, features, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) return sendError(res, ERROR_CODES.INTERNAL_ERROR, error.message, 500);
    return sendSuccess(res, data ?? []);
  } catch (err) {
    return next(err);
  }
});
