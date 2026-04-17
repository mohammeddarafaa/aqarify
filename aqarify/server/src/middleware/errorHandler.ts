import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error(err.message, { stack: err.stack });
  res.status(500).json({
    ok: false,
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
  });
}
