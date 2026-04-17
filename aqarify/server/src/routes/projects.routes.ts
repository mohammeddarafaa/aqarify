import { Router } from "express";
import { z } from "zod";
import { resolveTenant, type TenantRequest } from "../middleware/tenant";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { supabaseAdmin } from "../config/supabase";
import { sendSuccess, sendError, ERROR_CODES } from "../utils/response";

export const projectRoutes = Router();
projectRoutes.use(resolveTenant);

// GET /api/v1/projects — public
projectRoutes.get("/", async (req: TenantRequest, res, next) => {
  try {
    const { data } = await supabaseAdmin.from("projects")
      .select("id, name, description, location_lat, location_lng, address, cover_image_url, gallery, amenities, status")
      .eq("tenant_id", req.tenantId!).eq("status", "active")
      .order("created_at", { ascending: false });
    return sendSuccess(res, data ?? []);
  } catch (err) { return next(err); }
});

// GET /api/v1/projects/:id — public
projectRoutes.get("/:id", async (req: TenantRequest, res, next) => {
  try {
    const { data } = await supabaseAdmin.from("projects")
      .select("*, buildings(id, name, number, total_floors, total_units)")
      .eq("id", req.params.id).eq("tenant_id", req.tenantId!).single();
    if (!data) return sendError(res, ERROR_CODES.NOT_FOUND, "Project not found", 404);
    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});

const projectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  address: z.string().optional(),
  location_lat: z.number().optional(),
  location_lng: z.number().optional(),
  cover_image_url: z.string().url().optional(),
  amenities: z.array(z.string()).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

// POST /api/v1/projects — manager+
projectRoutes.post("/", authenticate, requireRole("manager", "admin"), async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const parsed = projectSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid input", 400, parsed.error.flatten());
    const { data, error } = await supabaseAdmin.from("projects")
      .insert({ tenant_id: req.tenantId!, ...parsed.data, status: parsed.data.status ?? "active" }).select().single();
    if (error) throw error;
    return sendSuccess(res, data, undefined, 201);
  } catch (err) { return next(err); }
});

// PATCH /api/v1/projects/:id
projectRoutes.patch("/:id", authenticate, requireRole("manager", "admin"), async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const parsed = projectSchema.partial().safeParse(req.body);
    if (!parsed.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid input", 400);
    const { data } = await supabaseAdmin.from("projects")
      .update(parsed.data).eq("id", req.params.id).eq("tenant_id", req.tenantId!).select().single();
    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});

export const ERROR_CODES_EXT = { NOT_FOUND: "NOT_FOUND" } as const;
