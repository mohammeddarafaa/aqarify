import type { NextFunction, Response } from "express";
import type { TenantRequest } from "./tenant";

export function attachTenantRegionHeaders(req: TenantRequest, res: Response, next: NextFunction) {
  if (req.tenantLocale) res.setHeader("x-tenant-locale", req.tenantLocale);
  if (req.tenantTimezone) res.setHeader("x-tenant-timezone", req.tenantTimezone);
  if (req.tenantCurrency) res.setHeader("x-tenant-currency", req.tenantCurrency);
  next();
}
