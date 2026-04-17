import type { Response } from "express";

export function sendSuccess<T>(
  res: Response,
  data: T,
  meta?: object,
  status = 200
) {
  return res.status(status).json({ ok: true, data, ...(meta && { meta }) });
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  status = 400,
  details?: object
) {
  return res.status(status).json({
    ok: false,
    error: { code, message, ...(details && { details }) },
  });
}

// Standard error codes
export const ERROR_CODES = {
  AUTH_REQUIRED: "AUTH_REQUIRED",
  AUTH_INVALID_TOKEN: "AUTH_INVALID_TOKEN",
  AUTH_FORBIDDEN: "AUTH_FORBIDDEN",
  TENANT_NOT_FOUND: "TENANT_NOT_FOUND",
  TENANT_SUSPENDED: "TENANT_SUSPENDED",
  UNIT_NOT_FOUND: "UNIT_NOT_FOUND",
  UNIT_NOT_AVAILABLE: "UNIT_NOT_AVAILABLE",
  UNIT_ALREADY_RESERVED: "UNIT_ALREADY_RESERVED",
  RESERVATION_NOT_FOUND: "RESERVATION_NOT_FOUND",
  RESERVATION_EXPIRED: "RESERVATION_EXPIRED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  PAYMENT_HMAC_INVALID: "PAYMENT_HMAC_INVALID",
  WAITLIST_ALREADY_JOINED: "WAITLIST_ALREADY_JOINED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  NOT_FOUND: "NOT_FOUND",
  UPLOAD_FAILED: "UPLOAD_FAILED",
} as const;
