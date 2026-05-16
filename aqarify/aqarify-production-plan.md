# Aqarify — Full Production Readiness Plan
**Role:** Staff Engineer & Technical Lead  
**Scope:** Every file, every layer — Backend · Frontend · Database · Infrastructure · Security · Observability  
**Generated from:** Full codebase audit (44,000+ lines across `/client`, `/server`, `/supabase`)  
**Last updated:** 2026-05-15

---

## Table of Contents

1. [Tech Stack Snapshot](#tech-stack)
2. [Master Risk Registry](#risk-registry)
3. [P0 — Critical (Launch Blockers)](#p0-critical)
4. [P1 — High Priority (First-Week Fixes)](#p1-high)
5. [P2 — Medium Priority (First-Month)](#p2-medium)
6. [P3 — Low Priority (Backlog)](#p3-low)
7. [Infrastructure & DevOps](#infra)
8. [Security Hardening Checklist](#security)
9. [Observability & Monitoring](#observability)
10. [Testing Strategy](#testing)
11. [Go/No-Go Launch Checklist](#launch-checklist)

---

## 1. Tech Stack Snapshot <a name="tech-stack"></a>

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite, React Router v7, TanStack Query v5, Zustand, shadcn/ui (Radix), Motion.dev, Tailwind v4 |
| **Backend** | Node.js + Express, TypeScript, Zod validation, node-cron, Winston logger |
| **Database** | Supabase (PostgreSQL 15), RLS policies, Realtime, Storage |
| **Auth** | Supabase Auth (JWT), service-role admin client on server |
| **Payments** | Paymob (Egypt/Gulf), Bank transfer fallback, AES-256-CBC encrypted credentials per tenant |
| **Notifications** | In-app (Supabase Realtime), SMS (Releans), Email (Resend) |
| **Infra** | Docker (client + server Dockerfiles), Nginx SPA, Railway (server), Vercel (client) |
| **Multi-tenancy** | Shared DB + RLS, hostname-based tenant resolution, per-tenant branding via CSS variables |

---

## 2. Master Risk Registry <a name="risk-registry"></a>

> Every item below maps to a numbered plan section. Plans 01–18 already exist in `Aqarify implementation plans ·MD`. Plans 19+ are **newly identified** in this audit.

| Plan | Severity | Area | Title | Status |
|------|----------|------|-------|--------|
| 01 | 🔴 P0 | Backend + FE | Per-tenant Paymob iframe ID | Existing plan |
| 02 | 🔴 P0 | Backend | Missing `/notifications/unread-count` route | Existing plan |
| 03 | 🔴 P0 | Frontend | Supabase anon key client usage | Existing plan |
| 04 | 🔴 P0 | Frontend | Admin overview uses hardcoded/demo data | Existing plan |
| 05 | 🔴 P0 | Frontend | Realtime waitlist timer countdown | Existing plan |
| 06 | 🔴 P0 | Backend | Agent reservations route not tenant-scoped | Existing plan |
| 07 | 🔴 P0 | Backend | Unit status not updated on reservation | Existing plan |
| 08 | 🔴 P0 | Backend + DB | Subscription expiry job | Existing plan |
| 09 | 🔴 P0 | Backend | Paymob HMAC verification hardening | Existing plan |
| 10 | 🔴 P0 | Backend | Manager reservations missing tenant scope | Existing plan |
| 11 | 🔴 P0 | Backend | `ENCRYPTION_KEY` startup validation | Existing plan |
| 12 | 🔴 P0 | Backend | Webhook rate-limit + HMAC 200-response | Existing plan |
| 13 | 🟠 P1 | Frontend | Supabase Realtime notification bell | Existing plan |
| 14 | 🟠 P1 | Frontend | Route-level error boundaries | Existing plan |
| 15 | 🟠 P1 | Frontend | Manager overview stub → real data | Existing plan |
| 16 | 🔵 P3 | Frontend | Dead code cleanup + duplicate libraries | Existing plan |
| 17 | 🔴 P0 | DB | Enum mismatches (waitlist/reservation status) | Existing plan |
| 18 | 🟠 P1 | FE + Backend | Receipt download button on success page | Existing plan |
| **19** | 🔴 **P0** | **Backend + DB** | **Race condition: unit double-reservation** | **NEW** |
| **20** | 🔴 **P0** | **Backend** | **Domain event handlers are stubs** | **NEW** |
| **21** | 🔴 **P0** | **Backend** | **Webhook idempotency table not used** | **NEW** |
| **22** | 🟠 **P1** | **Backend** | **Health + readiness endpoints missing** | **NEW** |
| **23** | 🟠 **P1** | **Backend** | **No graceful shutdown handler** | **NEW** |
| **24** | 🟠 **P1** | **Backend** | **Cron lock race condition (non-atomic)** | **NEW** |
| **25** | 🟠 **P1** | **Backend** | **Domain event dispatcher unsafe for multi-instance** | **NEW** |
| **26** | 🟠 **P1** | **Backend** | **No request-ID correlation in logs** | **NEW** |
| **27** | 🟠 **P1** | **Frontend** | **Platform admin dashboard is a stub** | **NEW** |
| **28** | 🟠 **P1** | **DB + Backend** | **`follow_ups` has no `status` column** | **NEW** |
| **29** | 🟠 **P1** | **FE + Backend** | **`super_admin` role scope gaps** | **NEW** |
| **30** | 🟠 **P1** | **Frontend** | **Hardcoded/demo data in dashboard pages** | **NEW** |
| **31** | 🟡 **P2** | **FE + Backend** | **Sentry error tracking not integrated** | **NEW** |
| **32** | 🟡 **P2** | **DevOps** | **CI/CD pipeline not defined** | **NEW** |
| **33** | 🟡 **P2** | **Backend** | **Image upload: no size limit / WebP conversion** | **NEW** |
| **34** | 🟡 **P2** | **Frontend** | **Bundle not code-split / route lazy-loaded** | **NEW** |
| **35** | 🟡 **P2** | **Backend** | **`sitemap.xml` + `robots.txt` not served** | **NEW** |
| **36** | 🟡 **P2** | **Backend + DB** | **Payment state machine not enforced** | **NEW** |
| **37** | 🟡 **P2** | **Backend** | **Encryption key rotation strategy missing** | **NEW** |
| **38** | 🔵 **P3** | **Frontend** | **PWA manifest not configured** | **NEW** |
| **39** | 🔵 **P3** | **FE + Backend** | **E2E smoke test suite incomplete** | **NEW** |
| **40** | 🔵 **P3** | **DevOps** | **No API documentation (OpenAPI/Swagger)** | **NEW** |

---

## 3. P0 — Critical (Launch Blockers) <a name="p0-critical"></a>

> ⛔ Nothing ships until every P0 is fixed. These either lose money, leak tenant data, or silently break payments.

---

### PLAN-01 · Per-Tenant Paymob Iframe ID
**Severity:** 🔴 P0 | **Est:** 2h | **Owner:** Backend + Frontend

**Problem:** `checkout-page.tsx` reads `import.meta.env.VITE_PAYMOB_IFRAME_ID` — a single build-time env var shared across all tenants. Every non-primary tenant gets payment failures with no error.

**Fix (already documented in existing plans):** The server `reservations.routes.ts` already selects `paymob_iframe_id` from `tenants` and returns it in the checkout payload. Verify `checkout-page.tsx` reads `data.iframe_id` from the API response — not from `import.meta.env`.

**Files:**
- `client/src/features/reservation/pages/checkout-page.tsx` — read `iframeId` from API response
- `client/.env.example` — remove `VITE_PAYMOB_IFRAME_ID` or mark deprecated

**✅ DoD:** Two tenants with different `paymob_iframe_id` values both complete payments correctly.

---

### PLAN-07 · Unit Status Flip on Reservation
**Severity:** 🔴 P0 | **Est:** 1h | **Owner:** Backend

**Problem:** `reservation.service.ts` → `createReservation()` calls `supabaseAdmin.from('units').update({ status: 'reserved' })` **after** inserting the reservation. If the update fails, unit is still shown as `available` and gets double-reserved.

**Fix:**
```typescript
// server/src/services/reservation.service.ts
// Wrap in a single DB transaction or use SELECT FOR UPDATE via RPC.
// Option A: Use an RPC function that atomically checks + updates + inserts.
// Option B: Use UPDATE ... RETURNING with a WHERE status='available' check:

const { data: lockedUnit, error: lockErr } = await supabaseAdmin
  .from('units')
  .update({ status: 'reserved' })
  .eq('id', unitId)
  .eq('tenant_id', tenantId)
  .eq('status', 'available')  // ← only succeeds if still available
  .select('id, price, reservation_fee')
  .single();

if (lockErr || !lockedUnit) {
  throw Object.assign(new Error('Unit not available'), { code: 'UNIT_NOT_AVAILABLE' });
}

// Now safely insert the reservation using lockedUnit data
```

**✅ DoD:** Concurrent requests for the same unit result in exactly one reservation; the second gets 409.

---

### PLAN-08 · Subscription Expiry Job
**Severity:** 🔴 P0 | **Est:** 2h | **Owner:** Backend

**Problem:** `subscriptionExpiry.ts` cron job must set `tenants.status = 'read_only'` when subscription lapses. Verify it actually fires and updates the tenant row, not just logs.

**Files:**
- `server/src/jobs/subscriptionExpiry.ts` — confirm `supabaseAdmin.from('tenants').update({ status: 'read_only' })` is called and `withCronLock` wraps it
- `server/src/middleware/subscriptionGuard.ts` — confirm it rejects writes when `tenant.status === 'read_only'`

**✅ DoD:** Setting a tenant subscription to expired causes their API write endpoints to return 402, and the frontend shows the `ReadOnlyBanner`.

---

### PLAN-09 + PLAN-12 · Webhook Security (HMAC + Rate Limit + Idempotency)
**Severity:** 🔴 P0 | **Est:** 3h | **Owner:** Backend

**Three issues, one fix session:**

**A. HMAC failure must return 200, not 401**
```typescript
// server/src/routes/webhooks.routes.ts
// Change all HMAC mismatch responses from:
return res.status(401).json({ error: 'invalid hmac' });
// To:
return res.status(200).json({ received: true }); // 401 fingerprints your endpoint
```

**B. Webhook rate limit**
```typescript
// server/src/index.ts — add before route registration
import rateLimit from 'express-rate-limit';
const webhookLimiter = rateLimit({ windowMs: 60_000, max: 120, skipSuccessfulRequests: false });
app.use('/webhooks', webhookLimiter);
```

**C. Idempotency using the `webhook_events` table (migration 00053 already created it)**
```typescript
// server/src/routes/webhooks.routes.ts — at the top of each handler, after HMAC passes:
const paymobTxId = String(payload.obj?.id ?? '');
if (paymobTxId) {
  const { data: existing } = await supabaseAdmin
    .from('webhook_events')
    .select('id')
    .eq('external_id', paymobTxId)
    .eq('source', 'paymob')
    .maybeSingle();

  if (existing) {
    return res.status(200).json({ received: true, duplicate: true });
  }

  await supabaseAdmin.from('webhook_events').insert({
    external_id: paymobTxId,
    source: 'paymob',
    tenant_id: req.tenantId,
    payload,
  });
}
```

**✅ DoD:** Same Paymob transaction ID processed twice results in only one reservation confirmation. HMAC failure returns 200.

---

### PLAN-17 · Enum Mismatches
**Severity:** 🔴 P0 | **Est:** 1h | **Owner:** DB

**Problem:** Code uses `status: 'waiting'`, `status: 'cancelled'` (on waiting_list), and `status: 'rejected'` (on reservations) — none of which exist in the DB ENUMs.

**New migration:** `supabase/supabase/migrations/00061_fix_missing_enum_values.sql`
```sql
ALTER TYPE waitlist_status ADD VALUE IF NOT EXISTS 'waiting';
ALTER TYPE waitlist_status ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'rejected';
```

**✅ DoD:** `supabase db push` runs clean. Joining a waitlist and rejecting a reservation both succeed.

---

### PLAN-19 · Race Condition: Unit Double-Reservation ⭐ NEW
**Severity:** 🔴 P0 | **Est:** 3h | **Owner:** Backend + DB

**Problem:** The reservation route checks `unit.status === 'available'` at the application layer, then separately creates the reservation and updates the unit status. Two concurrent POST requests can both read `available`, both create reservations for the same unit.

**Fix — create an atomic Postgres RPC function:**

**New migration:** `supabase/supabase/migrations/00062_fn_reserve_unit.sql`
```sql
CREATE OR REPLACE FUNCTION reserve_unit(
  p_tenant_id     UUID,
  p_unit_id       UUID,
  p_customer_id   UUID,
  p_total_price   NUMERIC,
  p_reservation_fee NUMERIC,
  p_payment_method TEXT,
  p_notes         TEXT DEFAULT NULL
)
RETURNS TABLE (
  reservation_id  UUID,
  confirmation_no TEXT,
  success         BOOLEAN,
  error_code      TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_unit_status unit_status;
  v_reservation_id UUID;
  v_confirmation TEXT;
BEGIN
  -- Atomic lock: only succeeds if unit is still available
  UPDATE units
    SET status = 'reserved'
  WHERE id = p_unit_id
    AND tenant_id = p_tenant_id
    AND status = 'available'
  RETURNING status INTO v_unit_status;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, FALSE, 'UNIT_NOT_AVAILABLE';
    RETURN;
  END IF;

  -- Generate confirmation number
  v_confirmation := 'RES-' || UPPER(SUBSTRING(p_unit_id::TEXT, 1, 6));

  -- Insert reservation
  INSERT INTO reservations (
    tenant_id, unit_id, customer_id, confirmation_number,
    status, total_price, reservation_fee_paid, payment_method, notes
  ) VALUES (
    p_tenant_id, p_unit_id, p_customer_id, v_confirmation,
    'pending', p_total_price, 0, p_payment_method, p_notes
  )
  RETURNING id INTO v_reservation_id;

  RETURN QUERY SELECT v_reservation_id, v_confirmation, TRUE, NULL::TEXT;
END;
$$;
```

**Update `reservation.service.ts`:**
```typescript
// server/src/services/reservation.service.ts
export async function createReservation(input: CreateReservationInput) {
  const { data, error } = await supabaseAdmin.rpc('reserve_unit', {
    p_tenant_id:        input.tenantId,
    p_unit_id:          input.unitId,
    p_customer_id:      input.customerId,
    p_total_price:      input.totalPrice,
    p_reservation_fee:  input.reservationFee,
    p_payment_method:   input.paymentMethod,
    p_notes:            input.notes ?? null,
  });

  if (error) throw error;
  const result = data?.[0];
  if (!result?.success) {
    throw Object.assign(new Error('Unit not available'), { code: 'UNIT_NOT_AVAILABLE' });
  }

  const { data: reservation } = await supabaseAdmin
    .from('reservations')
    .select('*')
    .eq('id', result.reservation_id)
    .single();

  return reservation!;
}
```

**✅ DoD:** 100 concurrent POST requests to the same unit result in exactly 1 reservation. All others return 409.

---

### PLAN-20 · Domain Event Handlers Are Stubs ⭐ NEW
**Severity:** 🔴 P0 | **Est:** 4h | **Owner:** Backend

**Problem:** `server/src/events/registerDomainHandlers.ts` has three handlers that only call `logger.info()`. They do nothing. `reservation.confirmed`, `reservation.cancelled`, and `waitlist.notified` all silently drop without triggering notifications, auto-agent-assignment, or lead creation.

**Fix — implement each handler:**

```typescript
// server/src/events/registerDomainHandlers.ts
import { onDomainEvent } from './domainEventBus';
import { logger } from '../utils/logger';
import { supabaseAdmin } from '../config/supabase';
import { sendNotification } from '../services/notification.service';

export function registerDomainHandlers() {
  if (registered) return;
  registered = true;

  // ─── reservation.confirmed ──────────────────────────────────────────────
  onDomainEvent('reservation.confirmed', async (event) => {
    const reservationId = event.aggregate_id;
    if (!reservationId) return;

    const { data: res } = await supabaseAdmin
      .from('reservations')
      .select('*, units(unit_number), users!customer_id(id, full_name, email)')
      .eq('id', reservationId)
      .single();

    if (!res) return;

    // 1. Notify customer
    await sendNotification({
      tenantId: res.tenant_id,
      userId: res.customer_id,
      type: 'reservation_confirmed',
      title: 'تم تأكيد حجزك',
      message: `تم تأكيد حجز الوحدة ${res.units?.unit_number}. رقم التأكيد: ${res.confirmation_number}`,
      channel: 'in_app',
    });

    // 2. Auto-assign agent (round-robin: pick agent with least active reservations)
    if (!res.agent_id) {
      const { data: agents } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('tenant_id', res.tenant_id)
        .eq('role', 'agent')
        .eq('is_active', true);

      if (agents && agents.length > 0) {
        // Simple round-robin: pick randomly for now
        const agent = agents[Math.floor(Math.random() * agents.length)];
        await supabaseAdmin
          .from('reservations')
          .update({ agent_id: agent.id })
          .eq('id', reservationId);

        await sendNotification({
          tenantId: res.tenant_id,
          userId: agent.id,
          type: 'reservation_assigned',
          title: 'حجز جديد مُسنَد إليك',
          message: `تم إسناد حجز الوحدة ${res.units?.unit_number} إليك.`,
          channel: 'in_app',
        });
      }
    }

    logger.info(`reservation.confirmed handled: ${reservationId}`);
  });

  // ─── reservation.cancelled ──────────────────────────────────────────────
  onDomainEvent('reservation.cancelled', async (event) => {
    const reservationId = event.aggregate_id;
    if (!reservationId) return;

    const { data: res } = await supabaseAdmin
      .from('reservations')
      .select('tenant_id, unit_id, customer_id, units(unit_number)')
      .eq('id', reservationId)
      .single();

    if (!res) return;

    // 1. Notify customer
    await sendNotification({
      tenantId: res.tenant_id,
      userId: res.customer_id,
      type: 'reservation_cancelled',
      title: 'تم إلغاء حجزك',
      message: `تم إلغاء حجز الوحدة ${res.units?.unit_number}.`,
      channel: 'in_app',
    });

    // 2. Auto-create lead for cancelled customer
    await supabaseAdmin.from('potential_customers').upsert({
      tenant_id: res.tenant_id,
      customer_id: res.customer_id,
      source: 'cancelled_reservation',
      source_reservation_id: reservationId,
      negotiation_status: 'new',
    }, { onConflict: 'customer_id,tenant_id,source_reservation_id', ignoreDuplicates: true });

    // 3. Notify next person on waitlist for this unit
    const { data: nextInLine } = await supabaseAdmin
      .from('waiting_list')
      .select('id, customer_id')
      .eq('unit_id', res.unit_id)
      .eq('tenant_id', res.tenant_id)
      .eq('status', 'waiting')
      .order('position', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextInLine) {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await supabaseAdmin.from('waiting_list').update({
        status: 'notified',
        notified_at: new Date().toISOString(),
        expires_at: expiresAt,
      }).eq('id', nextInLine.id);

      await sendNotification({
        tenantId: res.tenant_id,
        userId: nextInLine.customer_id,
        type: 'waitlist_unit_available',
        title: '🎉 الوحدة متاحة الآن!',
        message: `الوحدة ${res.units?.unit_number} متاحة. لديك 24 ساعة للحجز.`,
        channel: 'in_app',
      });
    }

    logger.info(`reservation.cancelled handled: ${reservationId}`);
  });

  // ─── waitlist.notified ──────────────────────────────────────────────────
  onDomainEvent('waitlist.notified', async (event) => {
    logger.info(`waitlist.notified handled: ${event.aggregate_id}`);
    // Further SMS/email integration goes here when Releans/Resend is wired
  });
}
```

**✅ DoD:** Confirming a reservation sends an in-app notification to the customer and assigns an agent. Cancelling creates a lead and notifies the waitlist.

---

### PLAN-21 · Webhook Idempotency Table Not Used ⭐ NEW
**Severity:** 🔴 P0 | **Est:** 1h | **Owner:** Backend

**Problem:** Migration `00053_webhook_events_idempotency.sql` created a `webhook_events` table, but `webhooks.routes.ts` never reads from or writes to it. Plan 12 adds an in-memory `if (reservation.status !== 'pending') return` check, which is better but not durable across restarts.

**Fix:** Use the DB table (covered under PLAN-12 fix C above). Ensure both the tenant-level and platform-level webhook handlers use it.

**Files:** `server/src/routes/webhooks.routes.ts`

**✅ DoD:** Restarting the server and re-delivering a webhook does not re-process it.

---

### PLAN-11 · `ENCRYPTION_KEY` Startup Validation
**Severity:** 🔴 P0 | **Est:** 30min | **Owner:** Backend

**Fix:** Add to `server/src/index.ts` before `app.listen()`:
```typescript
function validateEnv() {
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ENCRYPTION_KEY'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    console.error(`[startup] Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
  if (process.env.ENCRYPTION_KEY!.length !== 32) {
    console.error('[startup] ENCRYPTION_KEY must be exactly 32 characters');
    process.exit(1);
  }
}
validateEnv();
```

**✅ DoD:** Server fails to start if env vars are missing or malformed.

---

## 4. P1 — High Priority (First-Week Fixes) <a name="p1-high"></a>

---

### PLAN-13 · Supabase Realtime Notification Bell
**Severity:** 🟠 P1 | **Est:** 3h | **Owner:** Frontend

**Problem:** Bell polls every 60s. Notification arrives with up to 60s delay.

**Fix:** Implement `use-notification-bell.ts` with Supabase Realtime channel subscription (full code in existing Plan 13).

**Files:**
- `client/src/features/notifications/hooks/use-notification-bell.ts` — new file
- `client/src/components/shared/topbar.tsx` — replace polling with the hook

**✅ DoD:** Notification badge updates within ~1 second of server insert.

---

### PLAN-14 · Route-Level Error Boundaries
**Severity:** 🟠 P1 | **Est:** 2h | **Owner:** Frontend

**Fix:** Add `RouteErrorBoundary` component (code in existing Plan 14) and wire `errorElement` to every layout route in `router.tsx`.

**Files:**
- `client/src/components/shared/route-error-boundary.tsx` — new
- `client/src/app/router.tsx` — add `errorElement: <RouteErrorBoundary />`

**✅ DoD:** Any thrown error in a page shows the boundary with an error ID; does not white-screen.

---

### PLAN-15 · Manager Overview Stub → Real Data
**Severity:** 🟠 P1 | **Est:** 2h | **Owner:** Frontend

**Fix:** Replace "Phase 8 — coming soon" with KPI cards backed by `GET /manager/dashboard` (full code in existing Plan 15).

**Files:** `client/src/features/manager-dashboard/pages/overview-page.tsx`

**✅ DoD:** Manager sees 4 KPI cards with live data; no hardcoded strings.

---

### PLAN-18 · Receipt Download on Success Page
**Severity:** 🟠 P1 | **Est:** 1h | **Owner:** Frontend + Backend

**Fix:** Route `GET /api/v1/reservations/:id/receipt` already exists in `reservations.routes.ts`. Add a Download button to `reservation-success-page.tsx` calling it.

```typescript
// client/src/features/reservation/pages/reservation-success-page.tsx
<Button variant="outline" asChild>
  <a
    href={`${import.meta.env.VITE_API_URL}/reservations/${reservationId}/receipt`}
    download="receipt.pdf"
    target="_blank"
  >
    <Download className="size-4 mr-2" />
    تحميل الإيصال
  </a>
</Button>
```

**✅ DoD:** Customer can download their PDF receipt from the success page.

---

### PLAN-22 · Health + Readiness Endpoints ⭐ NEW
**Severity:** 🟠 P1 | **Est:** 1h | **Owner:** Backend

**Problem:** Railway and Docker health checks have no endpoint to call. Deployments can't be verified, and the load balancer can't detect unhealthy instances.

**Fix — add to `server/src/index.ts`:**
```typescript
// Health: fast check, no DB
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// Readiness: verify DB connectivity
app.get('/ready', async (_req, res) => {
  try {
    const { error } = await supabaseAdmin.from('tenants').select('id').limit(1);
    if (error) throw error;
    res.json({ status: 'ready', db: 'ok' });
  } catch (err) {
    res.status(503).json({ status: 'not_ready', error: String(err) });
  }
});
```

**Update `server/Dockerfile`:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3001}/health || exit 1
```

**✅ DoD:** `GET /health` returns 200 in <10ms. `GET /ready` returns 200 when DB is reachable, 503 otherwise.

---

### PLAN-23 · Graceful Shutdown ⭐ NEW
**Severity:** 🟠 P1 | **Est:** 1h | **Owner:** Backend

**Problem:** No SIGTERM handler. When Railway or Docker stops the container mid-request, in-flight transactions (especially payment confirmations) are killed abruptly, risking data corruption.

**Fix — add to `server/src/index.ts`:**
```typescript
import { stopDomainEventDispatcher } from './events/domainEventBus';

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

let isShuttingDown = false;

function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Received ${signal}, starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');

    // Stop background jobs
    stopDomainEventDispatcher();
    // Stop cron jobs
    for (const job of cronJobs) job.stop();

    logger.info('Graceful shutdown complete');
    process.exit(0);
  });

  // Force exit after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after 30s timeout');
    process.exit(1);
  }, 30_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
```

**✅ DoD:** `docker stop` gives the server 30s to finish in-flight requests before exiting.

---

### PLAN-24 · Cron Lock Race Condition ⭐ NEW
**Severity:** 🟠 P1 | **Est:** 2h | **Owner:** Backend

**Problem:** `withCronLock` in `cronLock.ts` does a **read-then-write** (check if locked, then upsert). Two server instances can both read "no lock" simultaneously and both start the job. The lock is not atomic.

**Fix — replace with a Postgres advisory lock via RPC:**

**New migration:** `supabase/supabase/migrations/00063_fn_acquire_cron_lock.sql`
```sql
CREATE OR REPLACE FUNCTION acquire_cron_lock(
  p_job_name    TEXT,
  p_lock_seconds INT,
  p_instance_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
BEGIN
  -- Atomic: insert or update only if lock has expired
  INSERT INTO cron_job_locks (job_name, locked_until, locked_by, updated_at)
  VALUES (p_job_name, v_now + (p_lock_seconds || ' seconds')::interval, p_instance_id, v_now)
  ON CONFLICT (job_name) DO UPDATE
    SET locked_until = v_now + (p_lock_seconds || ' seconds')::interval,
        locked_by    = p_instance_id,
        updated_at   = v_now
    WHERE cron_job_locks.locked_until < v_now;  -- ← only if expired

  RETURN FOUND;
END;
$$;
```

**Update `cronLock.ts`:**
```typescript
export async function withCronLock(
  jobName: string,
  lockSeconds: number,
  run: () => Promise<void>
): Promise<boolean> {
  const { data: acquired, error } = await supabaseAdmin
    .rpc('acquire_cron_lock', {
      p_job_name: jobName,
      p_lock_seconds: lockSeconds,
      p_instance_id: INSTANCE_ID,
    });

  if (error || !acquired) return false;

  try {
    await run();
    return true;
  } finally {
    // Release early (set locked_until to epoch)
    await supabaseAdmin
      .from('cron_job_locks')
      .update({ locked_until: new Date(0).toISOString() })
      .eq('job_name', jobName)
      .eq('locked_by', INSTANCE_ID);
  }
}
```

**✅ DoD:** With 3 server replicas running, each cron job runs exactly once per trigger window.

---

### PLAN-25 · Domain Event Dispatcher Multi-Instance Safety ⭐ NEW
**Severity:** 🟠 P1 | **Est:** 1h | **Owner:** Backend

**Problem:** `domainEventBus.ts` runs `setInterval(() => processPendingEvents(), 3000)` on every server instance. With 2 replicas, each event is processed twice.

**Fix — wrap `processPendingEvents` in the cron lock:**
```typescript
// server/src/events/domainEventBus.ts
import { withCronLock } from '../jobs/cronLock';

export function startDomainEventDispatcher() {
  if (dispatcherStarted) return;
  dispatcherStarted = true;

  dispatcherTimer = setInterval(async () => {
    try {
      await withCronLock('domain_event_dispatcher', 5, processPendingEvents);
    } catch (err) {
      logger.error('Domain event dispatcher failed', err);
    }
  }, 3_000);

  logger.info('Domain event dispatcher started');
}
```

**✅ DoD:** With multiple replicas, each domain event is processed exactly once.

---

### PLAN-26 · Request ID Correlation in Logs ⭐ NEW
**Severity:** 🟠 P1 | **Est:** 2h | **Owner:** Backend

**Problem:** `utils/logger.ts` has no request-ID concept. Every log line is anonymous. Production debugging is nearly impossible.

**Fix:**
```typescript
// server/src/middleware/requestId.ts
import { v4 as uuidv4 } from 'uuid';
import { AsyncLocalStorage } from 'async_hooks';

export const requestStorage = new AsyncLocalStorage<{ requestId: string }>();

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  res.setHeader('x-request-id', requestId);
  requestStorage.run({ requestId }, next);
}
```

```typescript
// server/src/utils/logger.ts — update all log calls to include requestId
import { requestStorage } from '../middleware/requestId';

function getRequestId() {
  return requestStorage.getStore()?.requestId ?? 'no-req';
}

export const logger = {
  info: (msg: string, meta?: object) =>
    console.log(JSON.stringify({ level: 'info', msg, reqId: getRequestId(), ts: new Date().toISOString(), ...meta })),
  error: (msg: string, err?: unknown) =>
    console.error(JSON.stringify({ level: 'error', msg, reqId: getRequestId(), ts: new Date().toISOString(), err: String(err) })),
  warn: (msg: string, meta?: object) =>
    console.warn(JSON.stringify({ level: 'warn', msg, reqId: getRequestId(), ts: new Date().toISOString(), ...meta })),
};
```

```typescript
// server/src/index.ts — add as first middleware
import { requestIdMiddleware } from './middleware/requestId';
app.use(requestIdMiddleware);
```

**✅ DoD:** Every log line has a `reqId`. Searching Logtail/Axiom by request ID shows the full trace.

---

### PLAN-27 · Platform Admin Dashboard is a Stub ⭐ NEW
**Severity:** 🟠 P1 | **Est:** 4h | **Owner:** Frontend

**Problem:** `platform-admin-dashboard-page.tsx` is a stub with no real data. The platform owner can't see cross-tenant metrics.

**Fix — wire to existing `GET /api/v1/platform-admin/*` routes:**
```typescript
// client/src/features/platform-admin/pages/platform-admin-dashboard-page.tsx
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function PlatformAdminDashboardPage() {
  const { data: tenants } = useQuery({
    queryKey: ['platform-admin-tenants'],
    queryFn: () => api.get('/platform-admin/tenants').then(r => r.data.data),
  });

  // Render: total tenants, active vs trial vs read_only counts,
  // per-tenant row with plan, status, last_activity, actions (suspend/activate)
}
```

**✅ DoD:** Super admin can see all tenants, their statuses, and activate/suspend from the dashboard.

---

### PLAN-28 · `follow_ups` Missing `status` Column ⭐ NEW
**Severity:** 🟠 P1 | **Est:** 1h | **Owner:** DB + Frontend

**Problem:** `agent-follow-ups-page.tsx` reads `row.original.status` and filters by `status === 'scheduled'`. The DB table `follow_ups` has no `status` column — it uses `completed_at` to determine state. This causes runtime crashes.

**Fix — add status column to DB:**

**New migration:** `supabase/supabase/migrations/00064_followups_add_status.sql`
```sql
ALTER TYPE followup_status_enum AS ENUM ('scheduled', 'completed', 'cancelled');
-- If no enum exists, create it:
DO $$ BEGIN
  CREATE TYPE followup_status_enum AS ENUM ('scheduled', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'scheduled'
  CHECK (status IN ('scheduled', 'completed', 'cancelled'));

-- Backfill from existing completed_at
UPDATE follow_ups SET status = 'completed' WHERE completed_at IS NOT NULL;
```

**Fix frontend to handle the DB shape as a fallback:**
```typescript
// Derive status if column missing (defensive)
const status = f.status ?? (f.completed_at ? 'completed' : 'scheduled');
```

**✅ DoD:** Follow-ups page loads without crashes; completed follow-ups show correct badge.

---

### PLAN-29 · `super_admin` Role Scope Gaps ⭐ NEW
**Severity:** 🟠 P1 | **Est:** 2h | **Owner:** FE + Backend

**Problem:** Several RBAC checks use `requireRole('manager', 'admin')` without including `'super_admin'`. The super admin can't access manager routes or report routes via backend.

**Files to audit and fix:**
```
server/src/routes/manager.routes.ts  — add 'super_admin' to all requireRole calls
server/src/routes/reports.routes.ts  — add 'super_admin'
server/src/routes/admin.routes.ts    — verify 'super_admin' is included
client/src/lib/rbac.ts               — ensure RBAC matrix includes super_admin for all manager+ actions
client/src/features/auth/components/protected-route.tsx — verify super_admin sees all layouts
```

**✅ DoD:** `super_admin` can navigate to manager dashboard, view reports, and access all admin settings without 403 errors.

---

### PLAN-30 · Hardcoded/Demo Data in Dashboard Pages ⭐ NEW
**Severity:** 🟠 P1 | **Est:** 3h | **Owner:** Frontend

**Problem:** The Aqarify revision audit calls out multiple dashboard pages showing demo/hardcoded revenue numbers and project names. Empty states must be shown when no real data exists.

**Files to audit:**
```
client/src/features/admin-dashboard/pages/overview-page.tsx
client/src/features/manager-dashboard/pages/manager-dashboard-page.tsx
client/src/features/agent-dashboard/pages/overview-page.tsx
```

**Pattern to enforce for each:**
```typescript
// Use API data. If data is null/empty, show EmptyState component:
if (!data || data.length === 0) {
  return <EmptyState title="لا توجد بيانات بعد" description="أضف مشاريع ووحدات للبدء" />;
}
```

**✅ DoD:** No hardcoded numbers in any dashboard. New tenants with zero data see empty states, not fake metrics.

---

## 5. P2 — Medium Priority (First Month) <a name="p2-medium"></a>

---

### PLAN-31 · Sentry Error Tracking ⭐ NEW
**Severity:** 🟡 P2 | **Est:** 3h | **Owner:** FE + Backend

**Backend (`server/src/index.ts`):**
```typescript
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV });
app.use(Sentry.Handlers.requestHandler());
// ... routes ...
app.use(Sentry.Handlers.errorHandler());
```

**Frontend (`client/src/main.tsx`):**
```typescript
import * as Sentry from '@sentry/react';
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.2,
});
```

**Update `RouteErrorBoundary`** to call `Sentry.captureException(error)` before rendering.

**✅ DoD:** Every unhandled server error and frontend crash appears in Sentry within 30 seconds, with the request ID and user context.

---

### PLAN-32 · CI/CD Pipeline ⭐ NEW
**Severity:** 🟡 P2 | **Est:** 4h | **Owner:** DevOps

**New file: `.github/workflows/ci.yml`:**
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-server:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: cd server && npm ci
      - run: cd server && npm run lint
      - run: cd server && npm run type-check
      - run: cd server && npm test

  test-client:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: cd client && npm ci
      - run: cd client && npm run lint
      - run: cd client && npm run type-check
      - run: cd client && npm test
      - run: cd client && npm run build

  deploy-preview:
    if: github.event_name == 'pull_request'
    needs: [test-server, test-client]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: [test-server, test-client]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: npx railway up --service server
```

**Add to `server/package.json`:**
```json
"scripts": {
  "lint": "eslint src",
  "type-check": "tsc --noEmit",
  "test": "vitest run"
}
```

**✅ DoD:** Every PR runs lint, type-check, and tests. Merge to `main` deploys automatically.

---

### PLAN-33 · Image Upload: Size Limits + WebP Conversion ⭐ NEW
**Severity:** 🟡 P2 | **Est:** 3h | **Owner:** Backend

**Problem:** No file size validation on image uploads. A 50MB RAW photo will crash the server and waste storage.

**Fix — add to image upload routes:**
```typescript
// server/src/middleware/upload.ts
import multer from 'multer';
import sharp from 'sharp';

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

export async function convertToWebP(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
}
```

**npm install (server):** `sharp multer`

**✅ DoD:** Uploading a 50MB PNG returns 413. All uploaded images are stored as WebP ≤ 10MB.

---

### PLAN-34 · Code Splitting / Route Lazy Loading ⭐ NEW
**Severity:** 🟡 P2 | **Est:** 2h | **Owner:** Frontend

**Problem:** `router.tsx` imports all page components at the top level. The entire app bundle loads on first visit. Dashboard pages are loaded even for public users.

**Fix — convert all page imports to `React.lazy()`:**
```typescript
// client/src/app/router.tsx
import { lazy, Suspense } from 'react';

const BrowseUnitsPage        = lazy(() => import('@/features/browse/pages/browse-units-page'));
const UnitDetailPage         = lazy(() => import('@/features/unit-details/pages/unit-detail-page'));
const AgentDashboardPage     = lazy(() => import('@/features/agent-dashboard/pages/overview-page'));
const ManagerDashboardPage   = lazy(() => import('@/features/manager-dashboard/pages/overview-page'));
// ... all pages

// Wrap each route element in Suspense:
{
  element: (
    <Suspense fallback={<PageSkeleton />}>
      <BrowseUnitsPage />
    </Suspense>
  )
}
```

**Add `vite-bundle-visualizer` to dev dependencies** for ongoing bundle monitoring.

**✅ DoD:** Initial JS bundle for the public landing page is under 200KB gzipped. Dashboard chunks load only when navigated to.

---

### PLAN-35 · `sitemap.xml` + `robots.txt` ⭐ NEW
**Severity:** 🟡 P2 | **Est:** 2h | **Owner:** Backend

**Problem:** No sitemap or robots.txt. Search engines can't index tenant property listings.

**Fix — add to `server/src/routes/tenants.routes.ts` or a new `seo.routes.ts`:**
```typescript
// GET /sitemap.xml — tenant-aware
app.get('/sitemap.xml', async (req, res) => {
  const tenant = req.tenant; // resolved by tenant middleware
  if (!tenant) return res.status(404).send('Not found');

  const { data: units } = await supabaseAdmin
    .from('units')
    .select('id, updated_at')
    .eq('tenant_id', tenant.id)
    .eq('status', 'available');

  const baseUrl = `https://${req.hostname}`;
  const urls = [
    `<url><loc>${baseUrl}/</loc></url>`,
    `<url><loc>${baseUrl}/browse</loc></url>`,
    ...(units ?? []).map(u =>
      `<url><loc>${baseUrl}/units/${u.id}</loc><lastmod>${u.updated_at?.split('T')[0]}</lastmod></url>`
    ),
  ].join('\n');

  res.setHeader('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
});

// GET /robots.txt
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nAllow: /\nDisallow: /dashboard\nDisallow: /admin\nDisallow: /api\nSitemap: /sitemap.xml');
});
```

**✅ DoD:** `GET /sitemap.xml` returns valid XML with all published unit URLs. `GET /robots.txt` blocks dashboard paths.

---

### PLAN-36 · Payment State Machine ⭐ NEW
**Severity:** 🟡 P2 | **Est:** 3h | **Owner:** Backend

**Problem:** There's no enforcement of valid reservation/payment status transitions. A webhook could theoretically move a `confirmed` reservation back to `pending`.

**Fix — add a transition guard service:**
```typescript
// server/src/services/stateMachine.ts
const RESERVATION_TRANSITIONS: Record<string, string[]> = {
  pending:   ['confirmed', 'cancelled', 'expired'],
  confirmed: ['cancelled'],  // Only admin/manager with reason
  cancelled: [],
  expired:   [],
  rejected:  [],
};

export function assertReservationTransition(from: string, to: string) {
  if (!RESERVATION_TRANSITIONS[from]?.includes(to)) {
    throw Object.assign(
      new Error(`Invalid reservation transition: ${from} → ${to}`),
      { code: 'INVALID_TRANSITION', status: 409 }
    );
  }
}

const PAYMENT_TRANSITIONS: Record<string, string[]> = {
  pending: ['paid', 'overdue'],
  overdue: ['paid'],
  paid:    [], // terminal
};

export function assertPaymentTransition(from: string, to: string) {
  if (!PAYMENT_TRANSITIONS[from]?.includes(to)) {
    throw Object.assign(
      new Error(`Invalid payment transition: ${from} → ${to}`),
      { code: 'INVALID_TRANSITION', status: 409 }
    );
  }
}
```

**Wire in `reservation.service.ts`, `webhooks.routes.ts`, and `agent.routes.ts`** before any status update.

**✅ DoD:** Attempting `confirmed → pending` returns 409. Every transition is logged to `activity_logs`.

---

### PLAN-37 · Encryption Key Rotation Strategy ⭐ NEW
**Severity:** 🟡 P2 | **Est:** 3h | **Owner:** Backend

**Problem:** All encrypted tenant Paymob credentials use a single key version. Rotating the key requires decrypting and re-encrypting all tenant secrets with no downtime strategy.

**Fix — already partly implemented** (credentials are prefixed with `v1:`). Formalize the rotation:

```typescript
// server/src/utils/encryption.ts
const KEYS: Record<string, string> = {};

// Parse ENCRYPTION_KEYS=v1:key1v1...,v2:key2v2... from env
(process.env.ENCRYPTION_KEYS ?? '').split(',').forEach(entry => {
  const [ver, key] = entry.split(':');
  if (ver && key) KEYS[ver] = key;
});

// Also support legacy single key
if (process.env.ENCRYPTION_KEY) KEYS['v1'] = process.env.ENCRYPTION_KEY;

export function encrypt(plaintext: string, version = 'v1'): string {
  const key = KEYS[version];
  if (!key) throw new Error(`No key for version ${version}`);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
  const body = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return `${version}:${iv.toString('hex')}:${body.toString('hex')}`;
}

export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(':');
  const version = parts[0];
  const iv = Buffer.from(parts[1], 'hex');
  const data = Buffer.from(parts[2], 'hex');
  const key = KEYS[version];
  if (!key) throw new Error(`No key for version ${version}`);
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
```

**Add a rotation script:** `server/scripts/rotate-encryption-keys.ts` — decrypts all tenant secrets with old version, re-encrypts with new version.

**✅ DoD:** Old credentials decrypt successfully with `v1` key. New credentials written with `v2` key. Both work simultaneously during a rolling deploy.

---

## 6. P3 — Low Priority (Backlog) <a name="p3-low"></a>

---

### PLAN-16 · Dead Code Cleanup
- Delete `client/src/App.tsx` and `client/src/App.css` (not imported anywhere)
- Remove `react-hot-toast` from `client/package.json` (duplicate of `sonner`)
- Add `supabase/supabase/.temp/` to `.gitignore`

### PLAN-38 · PWA Manifest ⭐ NEW
**File:** `client/public/manifest.json`
```json
{
  "name": "Aqarify",
  "short_name": "Aqarify",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F5F2E8",
  "theme_color": "#C8FF00",
  "icons": [{ "src": "/favicon.svg", "sizes": "any", "type": "image/svg+xml" }]
}
```
Wire `<link rel="manifest" href="/manifest.json">` in `client/index.html`.

### PLAN-39 · E2E Smoke Test Suite ⭐ NEW
Implement Playwright tests for the 7 critical journeys:
1. Customer browse → reserve → pay (card)
2. Customer browse → join waitlist
3. Agent confirm reservation
4. Manager view reports
5. Admin configure Paymob
6. Tenant signup → onboarding → publish
7. Super admin suspend tenant

Tests run against local Supabase (`supabase start`) seeded with `seed-kdevelopments-demo.ts`.

### PLAN-40 · API Documentation ⭐ NEW
Add `swagger-jsdoc` + `swagger-ui-express` to document all 40+ Express routes. Expose at `GET /api/docs` (internal only, behind auth for production).

---

## 7. Infrastructure & DevOps <a name="infra"></a>

### Docker Compose (Local Development)

**New file: `docker-compose.dev.yml`**
```yaml
version: '3.9'

services:
  server:
    build:
      context: ./server
      target: development
    ports: ['3001:3001']
    volumes: ['./server/src:/app/src']
    env_file: ./server/.env
    depends_on: [supabase]
    command: npm run dev

  client:
    build:
      context: ./client
      target: development
    ports: ['3000:3000']
    volumes: ['./client/src:/app/src']
    env_file: ./client/.env
    command: npm run dev
```

### Environment Files

**All required env vars for production deployment:**

**`server/.env.production` (template):**
```bash
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ENCRYPTION_KEY=<exactly-32-chars-openssl-rand-hex-16>
ENCRYPTION_KEYS=v1:<32-char-key>

# Notifications
RELEANS_API_KEY=...
RESEND_API_KEY=re_...

# Sentry (optional but recommended)
SENTRY_DSN=https://...@sentry.io/...

# Cron instance ID (for multi-replica setups)
CRON_INSTANCE_ID=replica-1

CORS_ORIGINS=https://[tenant].aqarify.com,https://app.aqarify.com
```

**`client/.env.production` (template):**
```bash
VITE_API_URL=https://api.aqarify.com/api/v1
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_MAPBOX_TOKEN=pk.eyJ1...
VITE_SENTRY_DSN=https://...@sentry.io/...
```

### Railway Deployment Checklist

```
[ ] Set all env vars listed above in Railway dashboard
[ ] Set HEALTHCHECK path to /health
[ ] Set start command: node dist/index.js
[ ] Enable restart on failure
[ ] Set memory limit: 512MB minimum
[ ] Configure custom domain pointing to Railway service
[ ] Enable auto-deploy from `main` branch
```

### Supabase Production Checklist

```
[ ] Enable Point-in-Time Recovery (PITR) — requires Pro plan
[ ] Set up daily backup export to S3/GCS
[ ] Enable Supabase Realtime only for required tables (notifications)
[ ] Review and tighten RLS policies (run EXPLAIN on each)
[ ] Enable pg_stat_statements for query performance monitoring
[ ] Set statement_timeout = '30s' to prevent runaway queries
[ ] Create read-only analytics role for reports (bypass app layer)
```

---

## 8. Security Hardening Checklist <a name="security"></a>

```
[ ] PLAN-09/12: HMAC verification returns 200 on failure (not 401)
[ ] PLAN-11: ENCRYPTION_KEY validated at startup
[ ] PLAN-22: /health endpoint responds (no DB on /health, DB on /ready)
[ ] Helmet.js: verify CSP, HSTS, X-Frame-Options headers set
[ ] CORS: whitelist only known client origins (no wildcard in production)
[ ] Rate limiting: verify limits on /auth/login, /reservations, /webhooks
[ ] Supabase service role key: NEVER exposed to client code
[ ] Storage policies: documents bucket requires auth; unit-images allows public read
[ ] RLS: run cross-tenant isolation tests (Tenant A cannot read Tenant B data)
[ ] Input validation: all POST/PATCH bodies go through Zod schemas
[ ] SQL injection: all DB access via supabaseAdmin client (no raw SQL with user input)
[ ] XSS: React auto-escapes JSX; no dangerouslySetInnerHTML usage
[ ] Tenant slug injection: validate slug format (alphanumeric + hyphen only)
[ ] PDF receipts: sign Supabase Storage URLs (already done with createSignedUrl)
[ ] Admin actions: verify super_admin endpoints require verified JWT (not just any auth)
[ ] Paymob HMAC: each tenant uses their own HMAC secret, not a shared one
[ ] Webhook endpoint: IP allowlist for Paymob IPs (optional but recommended)
[ ] Cookie flags: if using session cookies, ensure HttpOnly + SameSite=Strict
```

---

## 9. Observability & Monitoring <a name="observability"></a>

### Metrics to Track

| Metric | Tool | Alert Threshold |
|--------|------|-----------------|
| API error rate (5xx) | Sentry / Railway | > 1% of requests |
| Webhook failures | Sentry + DB `domain_events.status='failed'` | Any single failure |
| Cron job failures | Logger + Sentry | First occurrence |
| Payment intent failure | Paymob dashboard + Sentry | > 5% failure rate |
| DB connection pool saturation | Supabase dashboard | > 80% utilization |
| API p95 response time | Railway metrics | > 2s for any route |
| Frontend JS errors | Sentry | > 0.1% of sessions |
| Tenant `read_only` transitions | Activity logs | Any unexpected transition |

### Dashboard Setup (Recommended)

1. **Sentry** — frontend + backend error tracking, release health
2. **Axiom or Logtail** — structured log aggregation (pipe Winston JSON logs here)
3. **Supabase Dashboard** — DB query performance, storage usage, auth activity
4. **Railway** — CPU/memory/request metrics, deploy history
5. **Uptime monitoring** — Betterstack or UptimeRobot on `/health` endpoint

### Alert Rules to Configure

```
✅ /health returns non-200 for > 1 minute → PagerDuty/Slack alert
✅ domain_events table has > 10 'failed' rows → Slack alert
✅ tenant.status transitions to 'suspended' unexpectedly → Email alert
✅ Paymob webhook HMAC failures spike > 5/min → Slack alert
✅ Server restarts > 3 times in 10 minutes → PagerDuty alert
✅ Client JS error rate > 0.5% in any 5-minute window → Sentry alert
```

---

## 10. Testing Strategy <a name="testing"></a>

### Current Coverage (Audit Findings)

| File | Type | Status |
|------|------|--------|
| `client/src/lib/rbac.test.ts` | Unit | ✅ Exists |
| `client/src/lib/host.test.ts` | Unit | ✅ Exists |
| `client/src/features/browse/hooks/use-unit-filters.test.tsx` | Unit | ✅ Exists |
| `client/src/features/marketing/components/signup-validator.test.ts` | Unit | ✅ Exists |
| `client/src/features/marketing/pages/post-checkout-page.test.ts` | Unit | ✅ Exists |
| `server/scripts/e2e.ts` | Integration (custom) | ✅ Partial |
| Backend route tests | Integration | ❌ Missing |
| Playwright E2E | E2E | ❌ Missing |

### Tests to Write (Priority Order)

**Backend Integration Tests (use `vitest` + `supertest`):**
```
tests/routes/reservations.test.ts
  - POST /reservations with valid data → 201
  - POST /reservations for unavailable unit → 409
  - Concurrent POST /reservations same unit → exactly 1 success + 1 × 409
  - GET /reservations returns only requester's reservations
  
tests/routes/webhooks.test.ts
  - Valid HMAC → processes reservation confirmation
  - Invalid HMAC → returns 200, no side effects
  - Duplicate transaction ID → returns 200, no double-confirm
  
tests/middleware/subscriptionGuard.test.ts
  - Active tenant → allows write
  - read_only tenant → rejects write with 402
  
tests/middleware/tenant.test.ts
  - Valid slug in host → resolves tenant
  - Unknown slug → 404
  - Tenant A cannot access Tenant B resources by ID
```

**Frontend Component Tests (use `vitest` + `@testing-library/react`):**
```
tests/components/checkout-form.test.tsx
  - Renders payment methods
  - Submits with bank_transfer → shows bank details
  - Submits with card → initiates Paymob flow

tests/features/browse/use-unit-filters.test.tsx  (already exists — verify coverage)
```

**E2E Tests (Playwright):**
```
tests/e2e/customer-reservation.spec.ts
  - Browse → Unit detail → Reserve → Bank transfer → Success page

tests/e2e/agent-workflow.spec.ts
  - Login as agent → Confirm pending reservation → Customer notified

tests/e2e/manager-dashboard.spec.ts
  - Login as manager → View KPIs → View reports
```

---

## 11. Go/No-Go Launch Checklist <a name="launch-checklist"></a>

> This is the gate. Every item must be ✅ before any real tenant uses real customer data.

### 🔴 P0 — Hard Blockers (All must pass)

```
[ ] PLAN-01: Per-tenant Paymob iframe ID verified
[ ] PLAN-07: Unit status flip is atomic (no double-reservation possible)
[ ] PLAN-08: Subscription expiry cron fires and sets tenant to read_only
[ ] PLAN-09/12: Webhook HMAC returns 200 on failure; rate-limited; idempotent
[ ] PLAN-11: Server refuses to start without valid 32-char ENCRYPTION_KEY
[ ] PLAN-17: Enum migrations applied and verified clean
[ ] PLAN-19: DB-level unit reservation lock (concurrent POST → 409)
[ ] PLAN-20: Domain event handlers implemented (notifications, lead creation)
[ ] PLAN-21: Webhook idempotency table used in both webhook handlers
[ ] Two tenants can exist simultaneously with different Paymob credentials
[ ] Tenant A cannot access Tenant B units, reservations, or documents
[ ] All three cron jobs (paymentReminders, subscriptionExpiry, waitlistTimer) fire and log success
[ ] All required env vars present in production (see server + client .env templates above)
```

### 🟠 P1 — Required Before First Customer

```
[ ] PLAN-22: GET /health returns 200; GET /ready validates DB
[ ] PLAN-23: SIGTERM handled gracefully; in-flight requests complete
[ ] PLAN-24: Cron lock is atomic (multi-instance safe)
[ ] PLAN-25: Domain event dispatcher uses cron lock
[ ] PLAN-26: Every log line has a request ID
[ ] PLAN-28: follow_ups.status column exists
[ ] PLAN-29: super_admin can access all manager/admin routes
[ ] PLAN-30: No hardcoded demo data in any dashboard page
[ ] PLAN-14: Route error boundaries on all layouts
[ ] PLAN-18: Receipt download works on success page
[ ] All Sentry/error tracking alerts configured
[ ] Uptime monitoring on /health configured
[ ] Railway healthcheck path set to /health
[ ] Supabase Point-in-Time Recovery enabled
[ ] First tenant onboarding tested end-to-end manually
[ ] Bank transfer flow tested: reserve → upload receipt → agent verify → confirm
[ ] Card payment flow tested: reserve → Paymob → callback → confirm → receipt
[ ] Waitlist flow tested: join → unit released → notification → 24h timer → cascade
```

### 🟡 P2 — Required Before Scale (First 10 Tenants)

```
[ ] PLAN-31: Sentry integrated (FE + BE)
[ ] PLAN-32: CI/CD pipeline runs on every PR and deploys on merge to main
[ ] PLAN-33: Image upload validated (size limit + WebP)
[ ] PLAN-34: Route-level code splitting implemented
[ ] PLAN-35: sitemap.xml + robots.txt served
[ ] PLAN-36: Payment state machine enforced
[ ] PLAN-37: Encryption key rotation documented and tested
[ ] Lighthouse score 85+ on marketing landing page
[ ] API p95 response time under 500ms for all common reads
[ ] All environment variables documented in server/.env.example and client/.env.example
[ ] Backup restore tested at least once
[ ] Runbook for: server restart, DB migration rollback, tenant suspension, key rotation
```

---

## Appendix: Execution Sprint Map

| Sprint | Plans | Goal | Outcome |
|--------|-------|------|---------|
| **Sprint 1** (Day 1–3) | 01, 07, 09, 11, 12, 17, 19, 20, 21 | All P0 critical | No money lost, no data leaked |
| **Sprint 2** (Day 4–7) | 08, 22, 23, 24, 25, 26, 27, 28, 29, 30 | P1 infra + stubs | Platform ops-safe |
| **Sprint 3** (Day 8–10) | 13, 14, 15, 18, 16 | P1 UX + existing plans | Customer-facing polish |
| **Sprint 4** (Week 3) | 31, 32, 36, 37 | P2 observability + payments | Scale-ready |
| **Sprint 5** (Week 4) | 33, 34, 35, 38, 39, 40 | P2/P3 performance + SEO | Growth-ready |

---

*This document is the single source of truth for bringing Aqarify to 100% production readiness. Update the checklist items as each plan is executed and verified.*
