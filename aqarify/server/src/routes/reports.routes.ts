import { Router } from "express";
import { resolveTenant, requireTenant, type TenantRequest } from "../middleware/tenant";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import {
  getSalesReport,
  getFinancialReport,
  getInventoryReport,
  getAgentPerformanceReport,
} from "../services/report.service";
import { enforcePlanFeature } from "../middleware/planEnforcement";
import { sendSuccess } from "../utils/response";

export const reportRoutes = Router();
reportRoutes.use(resolveTenant, authenticate, requireTenant, requireRole("manager", "admin"));
reportRoutes.use(enforcePlanFeature("reports"));

function extractDateRange(query: Record<string, unknown>) {
  return {
    from: query.from ? String(query.from) : undefined,
    to: query.to ? String(query.to) : undefined,
  };
}

// GET /api/v1/reports/sales
reportRoutes.get("/sales", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const { from, to } = extractDateRange(req.query as Record<string, unknown>);
    const data = await getSalesReport(req.tenantId!, from, to);
    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});

// GET /api/v1/reports/financial
reportRoutes.get("/financial", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const { from, to } = extractDateRange(req.query as Record<string, unknown>);
    const data = await getFinancialReport(req.tenantId!, from, to);
    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});

// GET /api/v1/reports/inventory
reportRoutes.get("/inventory", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const data = await getInventoryReport(req.tenantId!);
    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});

// GET /api/v1/reports/agents
reportRoutes.get("/agents", async (req: TenantRequest & AuthenticatedRequest, res, next) => {
  try {
    const { from, to } = extractDateRange(req.query as Record<string, unknown>);
    const data = await getAgentPerformanceReport(req.tenantId!, from, to);
    return sendSuccess(res, data);
  } catch (err) { return next(err); }
});
