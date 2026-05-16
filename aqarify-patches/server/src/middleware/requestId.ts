import { AsyncLocalStorage } from "async_hooks";
import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";

export interface RequestContext {
  reqId: string;
}

/**
 * AsyncLocalStorage store that propagates the request ID through the entire
 * async call tree without passing it explicitly to every function.
 *
 * Usage in any module:
 *   import { requestStore } from "./requestId";
 *   const ctx = requestStore.getStore();
 *   const reqId = ctx?.reqId ?? "no-context";
 */
export const requestStore = new AsyncLocalStorage<RequestContext>();

/**
 * Express middleware — must be registered FIRST before any route.
 *
 * 1. Reads `x-request-id` from the incoming request (set by load-balancers /
 *    API gateways) or generates a fresh UUID.
 * 2. Echoes the ID back in `x-request-id` response header.
 * 3. Runs the rest of the request lifecycle inside the AsyncLocalStorage context
 *    so every logger call inside that request automatically includes `reqId`.
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const reqId =
    (req.headers["x-request-id"] as string | undefined) ?? randomUUID();

  res.setHeader("x-request-id", reqId);

  requestStore.run({ reqId }, () => {
    // Attach to req for convenience in error handlers / controllers
    (req as Request & { reqId: string }).reqId = reqId;
    next();
  });
}
