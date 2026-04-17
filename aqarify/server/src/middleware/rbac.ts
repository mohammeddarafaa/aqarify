import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./auth";
import { sendError, ERROR_CODES } from "../utils/response";

type Role = "super_admin" | "admin" | "manager" | "agent" | "customer";

export function requireRole(...roles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.userId) {
      return sendError(res, ERROR_CODES.AUTH_REQUIRED, "Authentication required", 401);
    }
    if (!roles.includes(req.userRole as Role)) {
      return sendError(res, ERROR_CODES.AUTH_FORBIDDEN, "Insufficient permissions", 403);
    }
    return next();
  };
}
