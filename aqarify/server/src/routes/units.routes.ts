import { Router } from "express";
import { z } from "zod";
import { resolveTenant, requireTenant, type TenantRequest } from "../middleware/tenant";
import { optionalAuth, authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { supabaseAdmin } from "../config/supabase";
import { sendSuccess, sendError, ERROR_CODES } from "../utils/response";

export const unitRoutes = Router();
unitRoutes.use(resolveTenant, optionalAuth, requireTenant);

// GET /api/v1/units
unitRoutes.get("/", async (req: TenantRequest, res, next) => {
  try {
    const {
      type,
      bedrooms,
      bathrooms,
      status,
      search,
      page = "1",
      limit = "12",
      min_price,
      max_price,
      min_size,
      max_size,
      floor,
      finishing,
      view_type,
      building_id,
      location,
      project_id,
      fha_eligible,
    } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from("units")
      .select(
        "id,unit_number,floor,type,bedrooms,bathrooms,size_sqm,price,reservation_fee,down_payment_pct,installment_months,status,gallery,view_type,finishing,building_id,project_id,location_lat,location_lng",
        { count: "exact" },
      )
      .eq("tenant_id", req.tenantId!);

    if (project_id && /^[0-9a-f-]{36}$/i.test(project_id)) {
      query = query.eq("project_id", project_id);
    }

    if (type && type !== "all") query = query.eq("type", type);
    if (bedrooms && bedrooms !== "all") query = query.eq("bedrooms", parseInt(bedrooms, 10));
    if (bathrooms && bathrooms !== "all") query = query.eq("bathrooms", parseInt(bathrooms, 10));
    if (status && status !== "all") query = query.eq("status", status);
    if (min_price) query = query.gte("price", parseFloat(min_price));
    if (max_price) query = query.lte("price", parseFloat(max_price));
    if (min_size) query = query.gte("size_sqm", parseFloat(min_size));
    if (max_size) query = query.lte("size_sqm", parseFloat(max_size));
    if (floor && floor !== "all") query = query.eq("floor", parseInt(floor, 10));
    if (finishing && finishing !== "all") query = query.eq("finishing", finishing);
    if (view_type && view_type !== "all") query = query.eq("view_type", view_type);
    if (building_id && /^[0-9a-f-]{36}$/i.test(building_id)) query = query.eq("building_id", building_id);
    if (fha_eligible === "true") {
      query = query.or(
        "custom_attributes->>fha_eligible.eq.true,custom_attributes->>fha_eligible.eq.True,custom_attributes->>fha_eligible.eq.1",
      );
    }
    if (search) query = query.ilike("unit_number", `%${search}%`);

    const RESERVED_QUERY_KEYS = new Set([
      "type",
      "bedrooms",
      "bathrooms",
      "status",
      "search",
      "page",
      "limit",
      "min_price",
      "max_price",
      "min_size",
      "max_size",
      "floor",
      "finishing",
      "view_type",
      "building_id",
      "location",
      "project_id",
      "fha_eligible",
      "attr_key",
      "attr_val",
    ]);

    for (const [key, rawVal] of Object.entries(req.query)) {
      if (RESERVED_QUERY_KEYS.has(key)) continue;
      const val = Array.isArray(rawVal) ? rawVal[0] : rawVal;
      if (val === undefined || val === "" || val === "all") continue;
      query = query.contains("custom_attributes", { [key]: String(val) });
    }

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

/** Batch fetch units for compare (GET so read_only tenants keep public browse). Ordered to match `ids`. */
const UUID_IN_QUERY = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

unitRoutes.get("/by-ids", async (req: TenantRequest, res, next) => {
  try {
    const q = req.query.ids;
    const raw = typeof q === "string" ? q : Array.isArray(q) && typeof q[0] === "string" ? q[0] : "";
    const tokens = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedIds = [...new Set(tokens.filter((t) => UUID_IN_QUERY.test(t)))].slice(0, 250);
    if (parsedIds.length === 0) {
      return sendSuccess(res, []);
    }

    const { data, error } = await supabaseAdmin
      .from("units")
      .select("*")
      .eq("tenant_id", req.tenantId!)
      .in("id", parsedIds);

    if (error) throw error;

    const byId = new Map((data ?? []).map((u) => [u.id, u]));
    const ordered = parsedIds.flatMap((id) => {
      const u = byId.get(id);
      return u ? [u] : [];
    });
    return sendSuccess(res, ordered);
  } catch (err) {
    return next(err);
  }
});

const scheduleVisitSchema = z.object({
  scheduled_at: z.string().min(1),
  phone: z.string().min(8),
  full_name: z.string().min(2).optional(),
  notes: z.string().optional(),
});

// POST /api/v1/units/:id/schedule-visit
unitRoutes.post("/:id/schedule-visit", authenticate, async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const parsed = scheduleVisitSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid input", 400, parsed.error.flatten());
    }

    const { data: unit } = await supabaseAdmin
      .from("units")
      .select("id")
      .eq("id", req.params.id)
      .eq("tenant_id", req.tenantId!)
      .maybeSingle();
    if (!unit) return sendError(res, ERROR_CODES.UNIT_NOT_FOUND, "Unit not found", 404);

    const { data: agents } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("tenant_id", req.tenantId!)
      .eq("role", "agent")
      .eq("is_active", true)
      .limit(1);
    const agentId = agents?.[0]?.id;
    if (!agentId) {
      return sendError(res, "NO_AGENT_AVAILABLE", "No agent available to assign visit", 503);
    }

    const noteLines = [
      parsed.data.full_name ? `Name: ${parsed.data.full_name}` : null,
      `Phone: ${parsed.data.phone}`,
      `Unit: ${req.params.id}`,
      parsed.data.notes ?? null,
    ].filter(Boolean) as string[];

    const { data, error } = await supabaseAdmin
      .from("follow_ups")
      .insert({
        tenant_id: req.tenantId!,
        agent_id: agentId,
        customer_id: req.userId!,
        type: "visit",
        scheduled_at: parsed.data.scheduled_at,
        notes: noteLines.join("\n"),
        status: "scheduled",
      })
      .select("id, scheduled_at")
      .single();

    if (error) throw error;
    return sendSuccess(
      res,
      {
        follow_up_id: data?.id,
        scheduled_at: data?.scheduled_at,
        confirmation_message: "Visit request recorded. An agent will confirm with you shortly.",
      },
      undefined,
      201,
    );
  } catch (err) {
    return next(err);
  }
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
