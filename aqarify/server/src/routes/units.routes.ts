import { Router } from "express";
import { resolveTenant, type TenantRequest } from "../middleware/tenant";
import { optionalAuth } from "../middleware/auth";
import { supabaseAdmin } from "../config/supabase";
import { sendSuccess, sendError, ERROR_CODES } from "../utils/response";

export const unitRoutes = Router();
unitRoutes.use(resolveTenant, optionalAuth);

// GET /api/v1/units
unitRoutes.get("/", async (req: TenantRequest, res, next) => {
  try {
    const {
      type,
      bedrooms,
      status,
      search,
      page = "1",
      limit = "12",
      min_price,
      max_price,
      location,
    } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from("units")
      .select("id,unit_number,floor,type,bedrooms,bathrooms,size_sqm,price,reservation_fee,down_payment_pct,installment_months,status,gallery,view_type,finishing,building_id,project_id", { count: "exact" })
      .eq("tenant_id", req.tenantId!);

    if (type && type !== "all") query = query.eq("type", type);
    if (bedrooms && bedrooms !== "all") query = query.eq("bedrooms", parseInt(bedrooms, 10));
    if (status && status !== "all") query = query.eq("status", status);
    if (min_price) query = query.gte("price", parseFloat(min_price));
    if (max_price) query = query.lte("price", parseFloat(max_price));
    if (search) query = query.ilike("unit_number", `%${search}%`);

    if (location && location !== "all") {
      const { data: projects, error: projErr } = await supabaseAdmin
        .from("projects")
        .select("id")
        .eq("tenant_id", req.tenantId!)
        .ilike("address", `%${location}%`);
      if (projErr) throw projErr;
      const projectIds = projects?.map((p) => p.id) ?? [];
      if (projectIds.length === 0) {
        return sendSuccess(res, [], {
          page: pageNum,
          limit: limitNum,
          total: 0,
          total_pages: 0,
        });
      }
      query = query.in("project_id", projectIds);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) throw error;

    const total = count ?? 0;
    return sendSuccess(res, data ?? [], {
      page: pageNum,
      limit: limitNum,
      total,
      total_pages: Math.ceil(total / limitNum),
    });
  } catch (err) { return next(err); }
});

// GET /api/v1/units/:id
unitRoutes.get("/:id", async (req: TenantRequest, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("units")
      .select("*")
      .eq("id", req.params.id)
      .eq("tenant_id", req.tenantId!)
      .single();

    if (error || !data) {
      return sendError(res, ERROR_CODES.UNIT_NOT_FOUND, "Unit not found", 404);
    }
    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});
