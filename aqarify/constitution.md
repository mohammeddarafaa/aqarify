# Aqarify — Project Constitution

> Governing principles that guide every specification, plan, task, and implementation decision.
> All coding agents must read and honour this document before taking any action.

---

## 1. Tenant Isolation is Sacred

Every database query, API route, and background job MUST be scoped to a `tenant_id`.
A single cross-tenant data leak invalidates the entire platform. There are no acceptable exceptions.

- **Rule:** Every Supabase query includes `.eq('tenant_id', req.tenantId)` — never bypass with a service role query that omits the tenant filter unless it is an explicitly platform-admin-only operation.
- **Rule:** RLS policies are a safety net, not the primary guard. Application-layer tenant scoping is required even when RLS exists.
- **Rule:** Any new route added to `server/src/routes/` must pass the tenant middleware before reaching business logic.

---

## 2. Money Cannot Be Lost

Payment flows are the highest-risk area of the codebase. Every change to reservation, webhook, or payment code requires:

- Atomic DB operations (Postgres functions/RPCs, not multi-step application-layer logic).
- Idempotency checks before processing any webhook.
- HMAC verification before reading any webhook payload.
- State machine enforcement: no status can move backward or skip steps.

**Rule:** If a payment-related code path can fail silently and leave money or data in an inconsistent state, it is a P0 bug — do not ship it.

---

## 3. Fail Loudly at Startup, Silently Never in Production

- Missing or malformed environment variables → process must exit with a clear error message before binding to any port.
- HMAC verification failure on webhooks → return HTTP 200 (do not fingerprint the endpoint), but log the anomaly.
- Any unhandled error in a background job → log with full stack trace and request ID; do not swallow silently.

---

## 4. Every Log Line Must Be Traceable

- All log output is structured JSON (never bare `console.log` strings in production code).
- Every log line emitted during an HTTP request must carry the `reqId` field populated by the `requestIdMiddleware`.
- Log levels: `info` for normal operations, `warn` for recoverable anomalies, `error` for failures requiring human attention.

---

## 5. Security by Default

- The Supabase service role key is **never** referenced in any file under `client/`.
- All user-supplied input passes through a Zod schema before touching any DB call.
- All image uploads are validated for MIME type and size before storage.
- Encrypted credentials use versioned keys (`v1:`, `v2:`) to support rotation without downtime.
- CORS origins are whitelisted; wildcard (`*`) is forbidden in production.

---

## 6. Code is Temporary; Specs are the Source of Truth

- Implementation decisions that deviate from the spec must update the plan before code is merged.
- Hardcoded demo data in any user-facing page is a bug, not a placeholder.
- Dead code (unused imports, duplicate libraries, unreachable branches) is removed, not commented out.

---

## 7. Observability is a First-Class Feature

- Every route has a measurable SLO: P95 response time < 500 ms for reads, < 2 s for writes.
- Health (`/health`) and readiness (`/ready`) endpoints must exist and be wired to the deployment health check.
- Domain events that fail must be recorded in the DB with `status = 'failed'` for retry and alerting.

---

## 8. Multi-Instance Safety

- No in-process singleton can be used for coordination across server replicas (no in-memory queues, no process-level caches for shared state).
- Cron job locking is handled by atomic Postgres advisory locks, not application-layer read-then-write checks.
- Domain event processing uses the cron lock to ensure exactly-once execution per event.

---

## 9. Arabic-First UX

- All user-facing strings are in Arabic by default.
- Error messages shown to customers must be human-readable Arabic, not English stack traces or HTTP codes.
- RTL layout is assumed; any new UI component must be tested in RTL mode.

---

## 10. Acceptance Criteria Gate

No feature is complete until:

- [ ] The DoD (Definition of Done) checklist in its task is fully checked.
- [ ] No TypeScript compiler errors (`tsc --noEmit` passes).
- [ ] No ESLint errors.
- [ ] Cross-tenant isolation test passes (Tenant A cannot read Tenant B data).
- [ ] The feature works with zero hardcoded data (empty state is handled).
