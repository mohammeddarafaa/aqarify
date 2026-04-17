import { Router } from "express";
import multer from "multer";
import { resolveTenant, type TenantRequest } from "../middleware/tenant";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { supabaseAdmin } from "../config/supabase";
import { sendSuccess, sendError, ERROR_CODES } from "../utils/response";
import { z } from "zod";

export const managerRoutes = Router();
managerRoutes.use(resolveTenant, authenticate, requireRole("manager", "admin"));
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype));
  },
});

// GET /api/v1/manager/reservations — all tenant reservations
managerRoutes.get("/reservations", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const status = req.query.status as string | undefined;
    let query = supabaseAdmin.from("reservations")
      .select(
        "*, units(unit_number, type, projects(name)), users!customer_id(full_name, email, phone)",
        { count: "exact" },
      )
      .eq("tenant_id", req.tenantId!)
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    if (status) query = query.eq("status", status);
    const { data, count } = await query;
    return sendSuccess(res, { items: data ?? [], total: count ?? 0, page, limit });
  } catch (err) { return next(err); }
});

managerRoutes.patch("/reservations/:id/status", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const body = req.body as { status: string; reason?: string };
    const { status, reason } = body;
    if (!status) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "status required", 400);
    const { data, error } = await supabaseAdmin.from("reservations")
      .update({ status, ...(reason ? { notes: reason } : {}) })
      .eq("id", req.params.id)
      .eq("tenant_id", req.tenantId!)
      .select()
      .single();
    if (error || !data) return sendError(res, ERROR_CODES.NOT_FOUND, "Not found", 404);
    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});

// GET /api/v1/manager/dashboard — key metrics
managerRoutes.get("/dashboard", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const tid = req.tenantId!;

    const [units, reservations, revenue, leads] = await Promise.all([
      supabaseAdmin.from("units").select("status", { count: "exact" }).eq("tenant_id", tid),
      supabaseAdmin.from("reservations").select("status", { count: "exact" }).eq("tenant_id", tid),
      supabaseAdmin.from("payments").select("amount").eq("tenant_id", tid).eq("status", "paid"),
      supabaseAdmin.from("potential_customers").select("stage", { count: "exact" }).eq("tenant_id", tid),
    ]);

    const unitStats = (units.data ?? []).reduce((acc: Record<string, number>, u: { status: string }) => {
      acc[u.status] = (acc[u.status] ?? 0) + 1; return acc;
    }, {});

    const resvStats = (reservations.data ?? []).reduce((acc: Record<string, number>, r: { status: string }) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1; return acc;
    }, {});

    const totalRevenue = (revenue.data ?? []).reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
    const leadStats = (leads.data ?? []).reduce((acc: Record<string, number>, l: { stage: string }) => {
      acc[l.stage] = (acc[l.stage] ?? 0) + 1; return acc;
    }, {});

    return sendSuccess(res, {
      units: { total: units.count ?? 0, ...unitStats },
      reservations: { total: reservations.count ?? 0, ...resvStats },
      revenue: { total: totalRevenue },
      leads: { total: leads.count ?? 0, ...leadStats },
    });
  } catch (err) { return next(err); }
});

// GET /api/v1/manager/agents — list agents + their stats
managerRoutes.get("/agents", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const { data } = await supabaseAdmin.from("users")
      .select("id, full_name, email, phone, role, created_at")
      .eq("tenant_id", req.tenantId!).in("role", ["agent", "manager"])
      .order("created_at", { ascending: false });
    return sendSuccess(res, data ?? []);
  } catch (err) { return next(err); }
});

// GET /api/v1/manager/projects — all tenant projects for management forms
managerRoutes.get("/projects", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const { data } = await supabaseAdmin
      .from("projects")
      .select("id, name, description, address, cover_image_url, status, created_at")
      .eq("tenant_id", req.tenantId!)
      .order("created_at", { ascending: false });
    return sendSuccess(res, data ?? []);
  } catch (err) { return next(err); }
});

// POST /api/v1/manager/agents — invite agent
const inviteSchema = z.object({
  email: z.string().email(), full_name: z.string().min(2),
  role: z.enum(["agent", "manager"]),
});

managerRoutes.post("/agents", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const parsed = inviteSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid input", 400);

    const { data: existing } = await supabaseAdmin.from("users")
      .select("id").eq("email", parsed.data.email).maybeSingle();

    if (existing) return sendError(res, "USER_EXISTS", "User already exists", 409);

    // Will be completed on first login with invite flow
    return sendSuccess(res, { invited: true, email: parsed.data.email }, undefined, 201);
  } catch (err) { return next(err); }
});

// GET /api/v1/manager/units — full unit management
managerRoutes.get("/units", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const { data, count } = await supabaseAdmin.from("units")
      .select("*, projects(name)", { count: "exact" })
      .eq("tenant_id", req.tenantId!).order("created_at", { ascending: false });
    return sendSuccess(res, { items: data ?? [], total: count ?? 0 });
  } catch (err) { return next(err); }
});

// PATCH /api/v1/manager/units/:id/status
managerRoutes.patch("/units/:id/status", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const schema = z.object({ status: z.enum(["available", "reserved", "sold", "unavailable"]) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid status", 400);

    const { data } = await supabaseAdmin.from("units")
      .update({ status: parsed.data.status }).eq("id", req.params.id)
      .eq("tenant_id", req.tenantId!).select().single();

    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});

// GET /api/v1/manager/waiting-list
managerRoutes.get("/waiting-list", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const { data } = await supabaseAdmin.from("waiting_list")
      .select("*, users!customer_id(full_name, email, phone)")
      .eq("tenant_id", req.tenantId!)
      .in("status", ["waiting", "notified", "active"])
      .order("position", { ascending: true });
    return sendSuccess(res, data ?? []);
  } catch (err) { return next(err); }
});

// POST /api/v1/manager/units — add new unit
const unitSchema = z.object({
  project_id: z.string().uuid(),
  building_id: z.string().uuid().optional(),
  unit_number: z.string().min(1),
  floor: z.number().int().optional(),
  type: z.string(),
  bedrooms: z.number().int().optional(),
  bathrooms: z.number().int().optional(),
  balconies: z.number().int().optional(),
  size_sqm: z.number().positive(),
  view_type: z.string().optional(),
  finishing: z.string().optional(),
  has_garden: z.boolean().optional(),
  garden_size: z.number().optional(),
  price: z.number().positive(),
  reservation_fee: z.number().positive().optional(),
  down_payment_pct: z.number().min(0).max(100).optional(),
  installment_months: z.number().int().positive().optional(),
  gallery: z.array(z.string()).optional(),
  floor_plan_url: z.string().optional(),
  virtual_tour_url: z.string().optional(),
  custom_attributes: z.record(z.string(), z.unknown()).optional(),
});

managerRoutes.post("/units", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const parsed = unitSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid input", 400, parsed.error.flatten());
    const payload = parsed.data;
    let buildingId = payload.building_id;

    if (!buildingId) {
      const { data: existingBuilding } = await supabaseAdmin.from("buildings")
        .select("id")
        .eq("tenant_id", req.tenantId!)
        .eq("project_id", payload.project_id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (existingBuilding?.id) {
        buildingId = existingBuilding.id;
      } else {
        const { data: createdBuilding, error: createBuildingError } = await supabaseAdmin
          .from("buildings")
          .insert({
            tenant_id: req.tenantId!,
            project_id: payload.project_id,
            name: "Main Building",
            number: "B1",
          })
          .select("id")
          .single();
        if (createBuildingError || !createdBuilding?.id) {
          return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Could not resolve building for selected project", 400);
        }
        buildingId = createdBuilding.id;
      }
    }

    const { data, error } = await supabaseAdmin.from("units")
      .insert({ tenant_id: req.tenantId!, status: "available", ...payload, building_id: buildingId }).select().single();
    if (error) throw error;
    return sendSuccess(res, data, undefined, 201);
  } catch (err) { return next(err); }
});

// POST /api/v1/manager/units/upload-image
managerRoutes.post("/units/upload-image", upload.single("file"), async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    if (!req.file) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "No file provided", 400);
    const ext = req.file.originalname.split(".").pop() ?? "jpg";
    const safeUnitId = (req.body.unit_id as string | undefined)?.trim() || "draft";
    const objectPath = `${req.tenantId}/${safeUnitId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("unit-images")
      .upload(objectPath, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
    if (uploadError) throw uploadError;

    const { data: pub } = supabaseAdmin.storage.from("unit-images").getPublicUrl(objectPath);
    return sendSuccess(res, { path: objectPath, publicUrl: pub.publicUrl }, undefined, 201);
  } catch (err) { return next(err); }
});

// POST /api/v1/manager/projects/upload-image
managerRoutes.post("/projects/upload-image", upload.single("file"), async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    if (!req.file) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "No file provided", 400);
    const ext = req.file.originalname.split(".").pop() ?? "jpg";
    const safeProjectId = (req.body.project_id as string | undefined)?.trim() || "draft";
    const objectPath = `${req.tenantId}/${safeProjectId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("project-images")
      .upload(objectPath, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
    if (uploadError) throw uploadError;

    const { data: pub } = supabaseAdmin.storage.from("project-images").getPublicUrl(objectPath);
    return sendSuccess(res, { path: objectPath, publicUrl: pub.publicUrl }, undefined, 201);
  } catch (err) { return next(err); }
});

// PATCH /api/v1/manager/units/:id
managerRoutes.patch("/units/:id", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const parsed = unitSchema.partial().safeParse(req.body);
    if (!parsed.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid input", 400);
    const { data } = await supabaseAdmin.from("units")
      .update(parsed.data).eq("id", req.params.id).eq("tenant_id", req.tenantId!).select().single();
    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});

// POST /api/v1/manager/waiting-list/:id/notify — manually notify next person
managerRoutes.post("/waiting-list/:id/notify", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabaseAdmin.from("waiting_list")
      .update({ status: "notified", notified_at: new Date().toISOString(), expires_at: expires })
      .eq("id", req.params.id).eq("tenant_id", req.tenantId!).select().single();
    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});

// DELETE /api/v1/manager/waiting-list/:id
managerRoutes.delete("/waiting-list/:id", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    await supabaseAdmin.from("waiting_list").delete().eq("id", req.params.id).eq("tenant_id", req.tenantId!);
    return sendSuccess(res, { removed: true });
  } catch (err) { return next(err); }
});

// GET /api/v1/manager/reports/sales
managerRoutes.get("/reports/sales", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const { from, to } = req.query;
    let query = supabaseAdmin.from("reservations")
      .select("status, total_price, created_at, units(type)")
      .eq("tenant_id", req.tenantId!);

    if (from) query = query.gte("created_at", from as string);
    if (to) query = query.lte("created_at", to as string);

    const { data } = await query;
    return sendSuccess(res, data ?? []);
  } catch (err) { return next(err); }
});
