# Aqarify — Production Readiness Patches · Apply Guide

All generated files are in this directory.  
Apply in the order below.  Each section maps to a plan item from the Implementation Plan.

---

## 0. Prerequisites

```bash
cd aqarify/
git checkout -b prod-readiness
```

---

## 1. Database Migrations (run FIRST — code depends on these)

Apply in this exact order:

```bash
# T1-D — missing enum values (waiting, cancelled, rejected)
# Already in migration 00031_fix_enums_receipt_followups.sql  ← already shipped

# T1-A — atomic reserve_unit() function
cp patches/supabase/migrations/00062_fn_reserve_unit.sql \
   supabase/supabase/migrations/

# T2-C — atomic acquire_cron_lock() function
cp patches/supabase/migrations/00063_fn_acquire_cron_lock.sql \
   supabase/supabase/migrations/

# T2-F — follow_ups.status column
# Already in migration 00031_fix_enums_receipt_followups.sql  ← already shipped

supabase db push
```

---

## 2. Server files

```bash
# T2-E — Request ID middleware + logger
cp patches/server/src/middleware/requestId.ts    server/src/middleware/
cp patches/server/src/utils/logger.ts            server/src/utils/

# T2-C — Atomic cron lock
cp patches/server/src/jobs/cronLock.ts           server/src/jobs/

# T1-C — Domain event handlers (fully implemented)
cp patches/server/src/events/registerDomainHandlers.ts  server/src/events/

# T2-D — Domain event bus (multi-instance safe)
cp patches/server/src/events/domainEventBus.ts          server/src/events/

# T1-A — Reservation service (atomic createReservation)
cp patches/server/src/services/reservation.service.ts   server/src/services/

# T3-F — State machine
cp patches/server/src/services/stateMachine.ts          server/src/services/

# T3-G — Encryption utility + rotation script
cp patches/server/src/utils/encryption.ts               server/src/utils/
mkdir -p server/scripts
cp patches/server/scripts/rotate-encryption-keys.ts     server/scripts/

# T2-A + T2-B + T1-E + T2-E — index.ts (health, graceful shutdown, requestId)
cp patches/server/src/index.ts                          server/src/

# T2-G — Platform admin routes (suspend/activate + last_activity)
cp patches/server/src/routes/platformAdmin.routes.ts    server/src/routes/

# T3-E — SEO routes
cp patches/server/src/routes/seo.routes.ts              server/src/routes/
# Then add to index.ts:  app.use("/", seoRoutes);

# T3-C — Image upload hardening middleware
cp patches/server/src/middleware/imageUpload.ts         server/src/middleware/

# T2-A — Dockerfile with HEALTHCHECK
cp patches/server/Dockerfile                            server/Dockerfile
```

### Wire SEO routes in index.ts (one-line addition)

In `server/src/index.ts`, after the other imports, add:

```typescript
import { seoRoutes } from "./routes/seo.routes";
```

And before the routes block:

```typescript
app.use("/", seoRoutes);
```

### Wire Sentry (T3-A — see config/sentry.setup.ts for exact snippets)

```bash
cd server && npm install @sentry/node @sentry/profiling-node
cd ../client && npm install @sentry/react
```

Follow the commented instructions in `patches/server/src/config/sentry.setup.ts`.

---

## 3. Client files

```bash
# T2-I — Realtime notification bell
cp patches/client/src/features/notifications/hooks/use-notification-bell.ts \
   client/src/features/notifications/hooks/

# T2-J — Route error boundary
cp patches/client/src/components/shared/route-error-boundary.tsx \
   client/src/components/shared/

# T2-G — Platform admin dashboard (suspend/activate UI)
cp patches/client/src/features/platform-admin/pages/platform-admin-dashboard-page.tsx \
   client/src/features/platform-admin/pages/
```

### Wire errorElement in router.tsx (T2-J)

For every layout `Route` that wraps child routes, add:

```tsx
import { RouteErrorBoundary } from "@/components/shared/route-error-boundary";

// Example:
{ path: "/", element: <DashboardLayout />, errorElement: <RouteErrorBoundary /> }
```

---

## 4. CI/CD Pipeline (T3-B)

```bash
mkdir -p .github/workflows
cp patches/.github/workflows/ci.yml .github/workflows/

# Add secrets in GitHub → Settings → Secrets:
#   RAILWAY_TOKEN
#   VERCEL_TOKEN
#   VERCEL_ORG_ID
#   VERCEL_PROJECT_ID
```

---

## 5. Verification checklist

After applying all patches, run:

```bash
# Server
cd server
npx tsc --noEmit          # must pass with 0 errors
npx eslint . --max-warnings 0
npm test

# Client
cd ../client
npx tsc --noEmit
npx eslint . --max-warnings 0
```

Manual smoke tests:

| Test | Expected |
|------|----------|
| `GET /health` | `{"status":"ok"}` in < 10 ms |
| `GET /ready` | `{"status":"ready"}` when DB is up, 503 when down |
| Two concurrent reservation requests for same unit | Exactly one 200, one 409 `UNIT_NOT_AVAILABLE` |
| POST `/webhooks/paymob/callback` with bad HMAC | HTTP 200 `{"received":true}`, anomaly logged |
| POST same valid webhook twice | Second returns 200, no re-processing |
| Kill server with `kill -SIGTERM <pid>` mid-request | In-flight requests complete, then exit 0 |
| Start server without `ENCRYPTION_KEY` | Process exits 1 with clear error |
| Notification bell after DB insert | Badge updates within ~1 second |

---

## 6. T4 Backlog (post-launch)

These are documented but not blocking:

- `dead-code-cleanup` — remove unused imports, react-hot-toast shim  
- `pwa-manifest` — add `/public/manifest.json`  
- `playwright-e2e` — 7 critical journey specs  
- `openapi-docs` — `/api/docs` endpoint  
