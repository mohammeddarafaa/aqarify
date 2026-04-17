import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { resolveTenant, type TenantRequest } from "../middleware/tenant";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { supabaseAdmin } from "../config/supabase";
import { sendSuccess, sendError, ERROR_CODES } from "../utils/response";
import { logger } from "../utils/logger";

export const documentRoutes = Router();
documentRoutes.use(resolveTenant, authenticate);
const staffRoles = new Set(["agent", "manager", "admin", "super_admin"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    cb(null, allowed.includes(file.mimetype));
  },
});

// GET /api/v1/documents — customer's own documents
documentRoutes.get("/", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const { data } = await supabaseAdmin.from("documents")
      .select("*").eq("user_id", req.userId!).eq("tenant_id", req.tenantId!)
      .order("created_at", { ascending: false });
    return sendSuccess(res, data ?? []);
  } catch (err) { return next(err); }
});

// GET /api/v1/documents/reservation/:reservationId
documentRoutes.get("/reservation/:reservationId", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    let query = supabaseAdmin.from("documents")
      .select("*")
      .eq("reservation_id", req.params.reservationId)
      .eq("tenant_id", req.tenantId!);

    if (!staffRoles.has(req.userRole ?? "")) {
      query = query.eq("user_id", req.userId!);
    }

    const { data } = await query;
    return sendSuccess(res, data ?? []);
  } catch (err) { return next(err); }
});

// POST /api/v1/documents/upload — file upload
documentRoutes.post("/upload", upload.single("file"), async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    if (!req.file) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "No file provided", 400);

    const typeSchema = z.enum(["national_id", "proof_of_address", "bank_receipt", "other"]);
    const docType = typeSchema.safeParse(req.body.type);
    if (!docType.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid document type", 400);

    const ext = req.file.originalname.split(".").pop() ?? "bin";
    const filePath = `documents/${req.tenantId}/${req.userId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("documents").upload(filePath, req.file.buffer, { contentType: req.file.mimetype, upsert: false });

    if (uploadError) {
      logger.error("Storage upload error", uploadError);
      return sendError(res, "UPLOAD_FAILED", "File upload failed", 500);
    }

    const { data: urlData } = supabaseAdmin.storage.from("documents").getPublicUrl(filePath);

    const { data, error } = await supabaseAdmin.from("documents").insert({
      tenant_id: req.tenantId!,
      user_id: req.userId!,
      reservation_id: req.body.reservation_id ?? null,
      type: docType.data,
      file_url: urlData.publicUrl,
      status: "pending",
    }).select().single();

    if (error) throw error;
    return sendSuccess(res, data, undefined, 201);
  } catch (err) { return next(err); }
});

// PATCH /api/v1/documents/:id/review — agent/manager only
const reviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  notes: z.string().optional(),
});

documentRoutes.patch("/:id/review", requireRole("agent", "manager", "admin"), async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid input", 400);
    const { data } = await supabaseAdmin.from("documents")
      .update({ status: parsed.data.status, reviewed_by: req.userId!, notes: parsed.data.notes })
      .eq("id", req.params.id).eq("tenant_id", req.tenantId!).select().single();
    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});

// GET /api/v1/documents/pending — agent/manager: all pending docs
documentRoutes.get("/pending", requireRole("agent", "manager", "admin"), async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const { data } = await supabaseAdmin.from("documents")
      .select("*, users!user_id(full_name, email)")
      .eq("tenant_id", req.tenantId!).eq("status", "pending")
      .order("created_at", { ascending: false });
    return sendSuccess(res, data ?? []);
  } catch (err) { return next(err); }
});
