# Aqarify — Technical Implementation Plan

**Feature ID:** 001  
**Feature Name:** production-readiness  
**Tech Stack:** Node.js + Express + TypeScript · React 19 + Vite · Supabase (PostgreSQL 15) · Railway · Vercel  
**Last Updated:** 2026-05-15

---

## Architecture Constraints

- **Multi-tenancy:** Shared database with Row-Level Security. Tenant is resolved from the request hostname. Every query must carry `tenant_id`.
- **Payments:** Paymob (Egypt/Gulf). Credentials are per-tenant, AES-256-CBC encrypted, versioned in the DB.
- **Deployment:** Server on Railway (Docker), Client on Vercel. Both can run multiple replicas.
- **Database:** Supabase-managed PostgreSQL 15. Migrations via `supabase db push`. No raw SQL with user input.
- **Auth:** Supabase JWT. Service role key is server-only. Anon key is client-safe but must be used for public routes only.

---

## Risk Triage (Implementation Priority)

All 40 identified gaps are grouped into 4 sprint tiers. The tier order is non-negotiable — later tiers depend on earlier ones being stable.

| Tier | Label | Gate |
|------|-------|------|
| **T1** | P0 Launch Blockers | Nothing ships until all T1 items pass |
| **T2** | P1 First-Customer Blockers | Required before any real customer data enters the system |
| **T3** | P2 Scale Readiness | Required before 10 tenants |
| **T4** | P3 Backlog | Nice-to-have; scheduled after scale |

---

## T1 — P0 Launch Blockers

### T1-A · Atomic Unit Reservation (Race Condition Fix)
**Plans 07 + 19 | Est: 4h**

**Problem:** Two concurrent reservation requests can both pass the `status = 'available'` check and create duplicate reservations for the same unit.

**Approach:** Replace the two-step application-layer check + update with a single Postgres function (`reserve_unit`) that atomically `UPDATE ... WHERE status = 'available'` and only inserts the reservation row if the update succeeded. The function returns a success flag and the new reservation ID. The application layer calls `supabaseAdmin.rpc('reserve_unit', ...)` and treats a `success: false` result as a 409 response.

**New DB artifact:** `supabase/migrations/00062_fn_reserve_unit.sql`  
**Modified server file:** `server/src/services/reservation.service.ts`  
**Error code exposed to client:** `UNIT_NOT_AVAILABLE` → HTTP 409

---

### T1-B · Webhook Security Triad (HMAC + Rate Limit + Idempotency)
**Plans 09 + 12 + 21 | Est: 3h**

**Problem:** Three independent gaps that together make the webhook endpoint exploitable and non-idempotent.

**Approach:**
1. **HMAC failure response:** Change from HTTP 401 → HTTP 200 with `{ received: true }`. Log the anomaly with request ID.
2. **Rate limiting:** Apply `express-rate-limit` at 120 req/min to `/webhooks/*` before HMAC check.
3. **Idempotency:** After HMAC passes, look up `webhook_events` table by `external_id + source`. If found, return 200 immediately. If not found, insert first, then process. The insert + process sequence prevents double-processing across server restarts.

**Modified server file:** `server/src/routes/webhooks.routes.ts`  
**Existing DB table used:** `webhook_events` (migration 00053 already exists)

---

### T1-C · Domain Event Handler Implementation
**Plan 20 | Est: 4h**

**Problem:** `registerDomainHandlers.ts` has three handlers that only call `logger.info()`. Business consequences (notifications, agent assignment, lead creation, waitlist cascade) never fire.

**Approach:** Implement each handler using existing service functions:
- `reservation.confirmed` → notify customer, auto-assign agent (round-robin from active agents in tenant), notify agent.
- `reservation.cancelled` → notify customer, upsert to `potential_customers` as a new lead, notify next `waiting` person in `waiting_list` for that unit and set their status to `notified` with a 24-hour `expires_at`.
- `waitlist.notified` → stub for now; SMS/email hooks go here post-launch.

**Modified server file:** `server/src/events/registerDomainHandlers.ts`  
**Services used:** `notification.service.ts` (existing), `supabaseAdmin` (existing)

---

### T1-D · Enum Migrations
**Plan 17 | Est: 1h**

**Problem:** Code uses `'waiting'`, `'cancelled'` (waitlist) and `'rejected'` (reservation) — none exist in DB enums.

**Approach:** Single migration adding the missing values with `ADD VALUE IF NOT EXISTS`.

**New DB artifact:** `supabase/migrations/00061_fix_missing_enum_values.sql`

---

### T1-E · Startup Environment Validation
**Plan 11 | Est: 30min**

**Approach:** Add a `validateEnv()` function called before `app.listen()`. Check for `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ENCRYPTION_KEY` (must be exactly 32 chars). Exit with code 1 and a human-readable error if any check fails.

**Modified server file:** `server/src/index.ts`

---

### T1-F · Per-Tenant Paymob Iframe ID
**Plan 01 | Est: 2h**

**Problem:** `checkout-page.tsx` reads from `import.meta.env.VITE_PAYMOB_IFRAME_ID` — a single build-time value. Every non-primary tenant gets the wrong iframe or a payment failure.

**Approach:** The server already returns `iframe_id` in the checkout payload. Verify `checkout-page.tsx` reads `data.iframe_id` from the API response. Remove `VITE_PAYMOB_IFRAME_ID` from `client/.env.example` (or mark deprecated).

**Modified client file:** `client/src/features/reservation/pages/checkout-page.tsx`

---

### T1-G · Subscription Expiry Cron Verification
**Plan 08 | Est: 2h**

**Approach:** Audit `server/src/jobs/subscriptionExpiry.ts` to confirm:
1. It calls `supabaseAdmin.from('tenants').update({ status: 'read_only' })` (not just logs).
2. It is wrapped in `withCronLock`.
3. `subscriptionGuard.ts` middleware actually reads `tenant.status` and returns 402 for `read_only`.

Write a manual test: set a tenant's subscription expiry to a past date and confirm the cron transitions the status.

---

## T2 — P1 First-Customer Blockers

### T2-A · Health & Readiness Endpoints
**Plan 22 | Est: 1h**

Two new routes in `server/src/index.ts`:
- `GET /health` — returns `{ status: 'ok', ts }` with no DB call. Used by Docker HEALTHCHECK and Railway.
- `GET /ready` — queries `tenants` table with `limit(1)`. Returns 200/503 based on DB connectivity.

Add `HEALTHCHECK` directive to `server/Dockerfile`.

---

### T2-B · Graceful Shutdown
**Plan 23 | Est: 1h**

Add `SIGTERM` and `SIGINT` handlers in `server/src/index.ts`. On signal:
1. Stop accepting new connections (`server.close()`).
2. Stop domain event dispatcher and all cron jobs.
3. Wait up to 30 seconds; force-exit if timeout exceeded.

This prevents payment confirmation requests being killed mid-flight during Railway rolling deploys.

---

### T2-C · Atomic Cron Lock
**Plan 24 | Est: 2h**

**Problem:** `withCronLock` does a read-then-write — not atomic. Two replicas can both acquire the lock simultaneously.

**Approach:** Replace with a Postgres function `acquire_cron_lock(job_name, lock_seconds, instance_id)` that uses `INSERT ... ON CONFLICT DO UPDATE ... WHERE locked_until < now()`. Returns `BOOLEAN` indicating whether the calling instance acquired the lock. Application `withCronLock` wraps the run function only if the RPC returns `true`.

**New DB artifact:** `supabase/migrations/00063_fn_acquire_cron_lock.sql`  
**Modified server file:** `server/src/jobs/cronLock.ts`

---

### T2-D · Domain Event Dispatcher Multi-Instance Safety
**Plan 25 | Est: 1h**

Wrap `processPendingEvents()` inside `withCronLock('domain_event_dispatcher', 5, ...)` in `domainEventBus.ts`. With multiple replicas, the lock ensures only one instance processes pending events per 3-second interval.

---

### T2-E · Request ID Middleware
**Plan 26 | Est: 2h**

New file `server/src/middleware/requestId.ts` using `AsyncLocalStorage` to propagate a `requestId` (from `x-request-id` header or generated UUID) through the entire request lifecycle. Update `utils/logger.ts` to read from the store and include `reqId` in every log line. Register as the first middleware in `server/src/index.ts`.

---

### T2-F · Follow-ups Status Column
**Plan 28 | Est: 1h**

Add `status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled'))` to the `follow_ups` table. Backfill from `completed_at IS NOT NULL`. This fixes a runtime crash in `agent-follow-ups-page.tsx`.

**New DB artifact:** `supabase/migrations/00064_followups_add_status.sql`

---

### T2-G · Super Admin Role Scope Fix
**Plan 29 | Est: 2h**

Audit all `requireRole(...)` calls in:
- `server/src/routes/manager.routes.ts`
- `server/src/routes/reports.routes.ts`
- `server/src/routes/admin.routes.ts`

Add `'super_admin'` to every call that currently only includes `'manager'` or `'admin'`. Verify `client/src/lib/rbac.ts` and `protected-route.tsx` treat `super_admin` as having all permissions.

---

### T2-H · Dashboard Stub Replacements
**Plans 04, 15, 27, 30 | Est: 7h total**

Four dashboards showing hardcoded or empty stub data must be connected to real API endpoints:

1. **Admin overview** (`admin-dashboard/pages/overview-page.tsx`) → `GET /admin/dashboard`
2. **Manager overview** (`manager-dashboard/pages/overview-page.tsx`) → `GET /manager/dashboard`
3. **Agent overview** (`agent-dashboard/pages/overview-page.tsx`) → `GET /agent/dashboard`
4. **Platform admin** (`platform-admin/pages/platform-admin-dashboard-page.tsx`) → `GET /platform-admin/tenants`

Pattern for each: use TanStack Query. If data is null or empty array, render `<EmptyState />` component — never hardcoded numbers or names.

---

### T2-I · Realtime Notification Bell
**Plan 13 | Est: 3h**

Replace the 60-second polling in `topbar.tsx` with a `useNotificationBell` hook that subscribes to a Supabase Realtime channel on the `notifications` table filtered by `user_id`. Unsubscribe on component unmount.

---

### T2-J · Route Error Boundaries
**Plan 14 | Est: 2h**

New component `client/src/components/shared/route-error-boundary.tsx` using React Router's `useRouteError`. Add `errorElement: <RouteErrorBoundary />` to every layout route in `router.tsx`. The boundary displays a user-facing Arabic error message with an error reference ID (from `reqId` if available) and a "Return to home" button.

---

### T2-K · Receipt Download Button
**Plan 18 | Est: 1h**

Add a download anchor to `reservation-success-page.tsx` pointing to `GET /api/v1/reservations/:id/receipt`. The route already exists in `reservations.routes.ts`.

---

## T3 — P2 Scale Readiness

### T3-A · Sentry Integration (Plan 31 | 3h)
Backend: `@sentry/node` request handler + error handler wrapping all routes. Frontend: `@sentry/react` with `browserTracingIntegration`. `RouteErrorBoundary` calls `Sentry.captureException`. Both environments tag events with `reqId` and `tenantId`.

### T3-B · CI/CD Pipeline (Plan 32 | 4h)
GitHub Actions workflow (`.github/workflows/ci.yml`):
- On PR: lint + type-check + unit tests for both `server/` and `client/`.
- On merge to `main`: auto-deploy server to Railway and client to Vercel.
- Secrets: `VERCEL_TOKEN`, `RAILWAY_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

### T3-C · Image Upload Hardening (Plan 33 | 3h)
Add `multer` + `sharp` middleware to image upload routes. Enforce: 10 MB max, JPEG/PNG/WebP only, convert all uploads to WebP at 85% quality, resize to max 1920×1080.

### T3-D · Route Code Splitting (Plan 34 | 2h)
Convert all page imports in `router.tsx` to `React.lazy()`. Wrap each route element in `<Suspense fallback={<PageSkeleton />}>`. Target: initial public bundle < 200 KB gzipped.

### T3-E · SEO Routes (Plan 35 | 2h)
New routes in `server/src/routes/seo.routes.ts`:
- `GET /sitemap.xml` — tenant-aware; lists all `available` unit URLs.
- `GET /robots.txt` — disallows `/dashboard`, `/admin`, `/api`.

### T3-F · Payment State Machine (Plan 36 | 3h)
New `server/src/services/stateMachine.ts` with `assertReservationTransition(from, to)` and `assertPaymentTransition(from, to)`. Called before any status update in `reservation.service.ts`, `webhooks.routes.ts`, `agent.routes.ts`. Invalid transitions return HTTP 409 with code `INVALID_TRANSITION`.

### T3-G · Encryption Key Rotation (Plan 37 | 3h)
Update `server/src/utils/encryption.ts` to parse `ENCRYPTION_KEYS=v1:key1,v2:key2` from env. Encrypt with current version, decrypt by detecting version prefix. Add `server/scripts/rotate-encryption-keys.ts` for batch re-encryption.

---

## T4 — P3 Backlog

| Plan | Item | Effort |
|------|------|--------|
| 16 | Dead code cleanup (App.tsx, react-hot-toast) | 1h |
| 38 | PWA manifest (`/public/manifest.json`) | 1h |
| 39 | Playwright E2E suite (7 critical journeys) | 8h |
| 40 | OpenAPI/Swagger docs on `/api/docs` | 4h |

---

## Database Migration Sequence

Migrations must be applied in this order before any T1/T2 code is deployed:

```
00061_fix_missing_enum_values.sql      ← T1-D
00062_fn_reserve_unit.sql              ← T1-A
00063_fn_acquire_cron_lock.sql         ← T2-C
00064_followups_add_status.sql         ← T2-F
```

---

## Environment Variables Required for Production

### Server (`server/.env.production`)

| Variable | Description | Constraint |
|----------|-------------|------------|
| `SUPABASE_URL` | Project URL | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin key | Required; never in client |
| `ENCRYPTION_KEY` | AES-256 key for tenant credentials | Exactly 32 chars |
| `ENCRYPTION_KEYS` | Versioned keys for rotation | Format: `v1:key1,v2:key2` |
| `RELEANS_API_KEY` | SMS provider | Optional pre-launch |
| `RESEND_API_KEY` | Email provider | Optional pre-launch |
| `SENTRY_DSN` | Error tracking | Recommended |
| `CRON_INSTANCE_ID` | Replica identifier for cron locks | Required on multi-instance |
| `CORS_ORIGINS` | Comma-separated allowed origins | No wildcard in production |

### Client (`client/.env.production`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Server API base URL |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon key (safe for client) |
| `VITE_MAPBOX_TOKEN` | Map rendering |
| `VITE_SENTRY_DSN` | Frontend error tracking |

---

## Research Notes

- Supabase Realtime for notifications: use `supabase.channel()` with `.on('postgres_changes', ...)` scoped to `notifications` table with a `filter: user_id=eq.{userId}` filter. Unsubscribe in the hook's cleanup function.
- `AsyncLocalStorage` for request ID propagation: built into Node.js `async_hooks`. No additional package needed.
- `sharp` for WebP conversion: requires the `sharp` npm package + the libvips native dependency. Available in the Railway Node.js Docker image.
- Postgres advisory lock via `ON CONFLICT DO UPDATE WHERE`: supported in PostgreSQL 15. The `FOUND` pseudo-variable correctly indicates whether the `DO UPDATE` branch ran.
