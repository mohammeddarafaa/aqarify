import { Router } from "express";
import { z } from "zod";
import { resolveTenant, requireTenant, type TenantRequest } from "../middleware/tenant";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { supabaseAdmin } from "../config/supabase";
import { sendError, sendSuccess, ERROR_CODES } from "../utils/response";

const addFavoriteSchema = z.object({
  unit_id: z.string().uuid(),
});

const syncFavoritesSchema = z.object({
  unit_ids: z.array(z.string().uuid()).max(200),
});

export const favoriteRoutes = Router();
favoriteRoutes.use(resolveTenant, requireTenant, authenticate);

async function getFavoriteUnitIds(tenantId: string, userId: string) {
  const { data, error } = await supabaseAdmin
    .from("favorite_units")
    .select("unit_id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => row.unit_id);
}

favoriteRoutes.get("/", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const unitIds = await getFavoriteUnitIds(req.tenantId!, req.userId!);
    return sendSuccess(res, unitIds);
  } catch (err) {
    return next(err);
  }
});

favoriteRoutes.post("/", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const parsed = addFavoriteSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid input", 400, parsed.error.flatten());
    }

    const unitId = parsed.data.unit_id;
    const { data: unit } = await supabaseAdmin
      .from("units")
      .select("id")
      .eq("id", unitId)
      .eq("tenant_id", req.tenantId!)
      .maybeSingle();

    if (!unit) return sendError(res, ERROR_CODES.UNIT_NOT_FOUND, "Unit not found", 404);

    await supabaseAdmin.from("favorite_units").upsert(
      {
        tenant_id: req.tenantId!,
        user_id: req.userId!,
        unit_id: unitId,
      },
      { onConflict: "tenant_id,user_id,unit_id", ignoreDuplicates: true },
    );

    return sendSuccess(res, { unit_id: unitId }, undefined, 201);
  } catch (err) {
    return next(err);
  }
});

favoriteRoutes.delete("/:unitId", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const unitId = req.params.unitId;
    if (!z.string().uuid().safeParse(unitId).success) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid unit id", 400);
    }

    const { error } = await supabaseAdmin
      .from("favorite_units")
      .delete()
      .eq("tenant_id", req.tenantId!)
      .eq("user_id", req.userId!)
      .eq("unit_id", unitId);
    if (error) throw error;

    return sendSuccess(res, { unit_id: unitId, removed: true });
  } catch (err) {
    return next(err);
  }
});

favoriteRoutes.post("/sync", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const parsed = syncFavoritesSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid input", 400, parsed.error.flatten());
    }

    const unitIds = [...new Set(parsed.data.unit_ids)];
    if (unitIds.length > 0) {
      const { data: validUnits, error: unitsErr } = await supabaseAdmin
        .from("units")
        .select("id")
        .eq("tenant_id", req.tenantId!)
        .in("id", unitIds);
      if (unitsErr) throw unitsErr;

      const validUnitIds = new Set((validUnits ?? []).map((u) => u.id));
      const rows = unitIds
        .filter((id) => validUnitIds.has(id))
        .map((unitId) => ({
          tenant_id: req.tenantId!,
          user_id: req.userId!,
          unit_id: unitId,
        }));

      if (rows.length > 0) {
        const { error: insertErr } = await supabaseAdmin
          .from("favorite_units")
          .upsert(rows, { onConflict: "tenant_id,user_id,unit_id", ignoreDuplicates: true });
        if (insertErr) throw insertErr;
      }
    }

    const merged = await getFavoriteUnitIds(req.tenantId!, req.userId!);
    return sendSuccess(res, merged);
  } catch (err) {
    return next(err);
  }
});
