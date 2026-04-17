# Aqarify Platform — Build Progress

## Current Phase: SaaS Remediation (Waves 1–5)
## Status: Waves 1–5 implemented; strict E2E harness added
## Last Updated: 2026-04-17

---

### PHASE 0: Scaffolding ✅ COMPLETE

- [x] 0.1 Create monorepo structure (`/client`, `/server`, `/supabase`)
- [x] 0.2 Initialize `/client` — Vite + React 19 + TypeScript
- [x] 0.3 Install client deps — router, zustand, react-query, motion, i18n, mapbox, etc.
- [x] 0.4 Install + configure Tailwind CSS v4 with CSS variable theming
- [x] 0.5 shadcn/ui — component stubs generated
- [x] 0.6 `cn()` utility — clsx + tailwind-merge in `lib/utils.ts`
- [x] 0.7 React Router v7 — `router.tsx` with nested layout routes, lazy-loaded pages
- [x] 0.8 Zustand stores — `auth.store.ts`, `tenant.store.ts`, `ui.store.ts`
- [x] 0.9 TanStack Query provider in `app/providers.tsx`
- [x] 0.10 i18n — `react-i18next`, Arabic + English JSON files per feature
- [x] 0.11 Initialize `/server` — Express + TypeScript, `tsconfig.json`
- [x] 0.12 Install server deps — express, supabase, resend, zod, winston, axios, etc.
- [x] 0.13 Express app entry — middleware stack (cors, helmet, rate-limit, error handler)
- [x] 0.14 API response helpers — `sendSuccess()`, `sendError()`, error code constants
- [x] 0.15 Supabase structure — `supabase/migrations/`, seed.sql
- [x] 0.16 Migrations 00001–00018 — all tables, RLS, functions, triggers, indexes
- [x] 0.19 Migration 00019 — Paymob columns, agent_id, is_active
- [x] 0.21 `seed.sql` — demo tenant K-Developments, projects, units
- [x] 0.22 `.cursor/rules/` — general, react-components, api-routes, supabase, styling
- [x] 0.23 `PROGRESS.md` — this file

---

### PHASE 1: Auth + Tenant System ✅ COMPLETE
- [x] 1.1 Supabase Auth — signup, login, password reset
- [x] 1.2 Auth pages — login, register, forgot password
- [x] 1.3 Auth hooks — `use-auth.ts`, `use-current-user.ts`, `use-session-restore.ts`
- [x] 1.4 Tenant resolution middleware (server)
- [x] 1.5 Client-side tenant resolution hook
- [x] 1.6 Tenant branding — CSS variable injection via `use-tenant-theme.ts`
- [x] 1.7 Dynamic favicon + logo swap
- [x] 1.8 RBAC middleware (server) — `rbac.ts`
- [x] 1.9 Protected routes (client) — `ProtectedRoute` component
- [x] 1.10 Layout routes — Public, Auth, Dashboard (with role guards)
- [x] 1.11 Server `/auth/me` + `/auth/complete-profile` + `/auth/session`
- [x] 1.12 RTL layout — `use-tenant-theme.ts` sets `dir` and `lang` on html

### PHASE 2: Public Pages ✅ COMPLETE
- [x] 2.1 Landing page — hero, amenities, contact sections
- [x] 2.2 Navbar with tenant branding
- [x] 2.3 Browse page — unit grid, search, filter bar, infinite scroll
- [x] 2.4 Unit card + skeleton loader
- [x] 2.5 Unit detail page — pricing section, payment calculator
- [x] 2.6 Footer component

### PHASE 3: Reservation + Payment ✅ COMPLETE
- [x] 3.1 Paymob service — auth token, order creation, payment key
- [x] 3.2 HMAC verification utility + encrypt/decrypt for API keys
- [x] 3.3 Reservation service — create + confirm + installment schedule
- [x] 3.4 `POST /api/v1/reservations` — unit availability check + payment key
- [x] 3.5 `GET /api/v1/reservations` + `GET /:id` + `POST /:id/confirm`
- [x] 3.6 `POST /webhooks/paymob/callback` — HMAC verified, auto-confirm
- [x] 3.7 Payment routes — GET /payments, /reservation/:id, /:id
- [x] 3.8 Checkout form (client) — method selector, billing data
- [x] 3.9 Checkout page + Paymob redirect
- [x] 3.10 Reservation success page

### PHASE 4: Waiting List ✅ COMPLETE
- [x] 4.1 `POST /api/v1/waiting-list` — join with position
- [x] 4.2 `GET /api/v1/waiting-list/my` + `DELETE /my`
- [x] 4.3 Client hooks — `useMyWaitingEntry`, `useJoinWaitingList`, `useLeaveWaitingList`

### PHASE 5: Customer Dashboard ✅ COMPLETE
- [x] 5.1 Customer dashboard page — stats cards
- [x] 5.2 My reservations list with status badges
- [x] 5.3 Upcoming payments list

### PHASE 6: Agent Dashboard + CRM ✅ COMPLETE
- [x] 6.1 Agent reservation management — list, filter, confirm/reject
- [x] 6.2 Potential customers pipeline — add, stage progression
- [x] 6.3 Follow-up scheduler — list, mark complete

### PHASE 7: Potential Customer Pipeline ✅ COMPLETE
- [x] 7.1 `GET/POST /api/v1/agent/potential-customers`
- [x] 7.2 `PATCH /agent/potential-customers/:id/stage`
- [x] 7.3 `GET/POST /agent/follow-ups` + `PATCH /:id/complete`
- [x] 7.4 Kanban-style stage management in UI

### PHASE 8: Manager Dashboard ✅ COMPLETE
- [x] 8.1 `GET /api/v1/manager/dashboard` — units, reservations, revenue, leads stats
- [x] 8.2 `GET /manager/agents` + `POST /manager/agents`
- [x] 8.3 `GET/PATCH /manager/units` — status management
- [x] 8.4 `GET /manager/waiting-list`
- [x] 8.5 `GET /manager/reports/sales`
- [x] 8.6 Manager dashboard page — stat cards + funnel chart
- [x] 8.7 Manager units table with status toggle
- [x] 8.8 Manager waiting list page

### PHASE 9: Admin Dashboard ✅ COMPLETE
- [x] 9.1 `GET/PATCH /api/v1/admin/tenant` — branding, colors, contact
- [x] 9.2 `PATCH /admin/tenant/paymob` — encrypted API key storage
- [x] 9.3 `GET /admin/users` + `PATCH /admin/users/:id/role`
- [x] 9.4 Admin settings page — general, Paymob, users tabs

### PHASE 10: Notifications ✅ COMPLETE
- [x] 10.1 `GET /api/v1/notifications` + `GET /unread-count`
- [x] 10.2 `POST /notifications/mark-all-read` + `PATCH /:id/read`
- [x] 10.3 Notifications page with type icons
- [x] 10.4 Topbar bell icon with unread count badge

### PHASE 11: Tenant Customization ✅ COMPLETE
- [x] 11.1 Dynamic CSS variable injection from tenant config
- [x] 11.2 Admin color picker in settings
- [x] 11.3 Per-tenant Paymob credentials (encrypted)
- [x] 11.4 Shared sidebar with role-based nav items

### PHASE 12: Polish + Production 🔲 IN PROGRESS
- [ ] 12.1 Run `supabase db push` to apply migrations `00020–00025`
- [x] 12.2 Start dev servers — `npm run dev` in client + server
- [x] 12.3 Seed data + verify core flows via strict E2E harness
- [ ] 12.4 Deploy to Vercel (client) + Railway (server)

---

### SaaS Remediation (2026-04-17) ✅ IMPLEMENTED
- [x] Wave 1 — Client route/nav integrity: fixed dead links (`/reservations`, `/payments`, `/manager/agents`), added `reset-password`, wired payment-failure route.
- [x] Wave 2 — Server isolation hardening: tenant-scoped reservation reads/writes, restricted confirm endpoint roles, ownership checks for payments/documents by reservation, removed spoofable `x-tenant-id` fallback.
- [x] Wave 3 — Supabase alignment: added `00025_harden_public_rls.sql`, expanded seed for `roya-developments` + `expired-demo` project/units, regenerated `client/src/types/database.types.ts`.
- [x] Wave 4 — Phase F subscription admin: added Subscription tab (plan/status/days remaining/renew/cancel/invoices), relabeled Paymob tab to “Customer Payments”, added `/subscription/change-plan` API and renewal-period extension fix.
- [x] Wave 5 — Strict E2E runner: added `server/scripts/e2e.ts`, `npm run e2e`, `npm run test:strict`.

### Strict E2E Execution Notes
- Last run: `npm run e2e` -> passing.
- Covered in current environment:
  - Public tenant isolation by unit ID
  - SaaS signup + activation path
- Role-dependent flows (customer/agent/manager/admin/read-only write-block) auto-skip when auth-admin provisioning is unavailable in the current Supabase environment.
- To force full strict matrix without skips, provide tokens:
  - `E2E_TOKEN_CUSTOMER_A`
  - `E2E_TOKEN_AGENT_A`
  - `E2E_TOKEN_MANAGER_A`
  - `E2E_TOKEN_ADMIN_A`
  - `E2E_TOKEN_ADMIN_EXPIRED`

### Manual UI Walkthrough Checklist
- [ ] Marketing mode on localhost (`/`) loads unified landing and section anchors (`#pricing`, `#faq`, `#contact`).
- [ ] Tenant mode on localhost (`?tenant=<slug>`) loads tenant landing and browse.
- [ ] Login/register/forgot/reset routes work in tenant mode and do not 404 in marketing mode (tenant redirect prompt shown).
- [ ] Sidebar links for each role navigate to valid pages (customer, agent, manager, admin).
- [ ] Read-only tenant shows banner and blocks write actions in UI.
- [ ] Admin Subscription tab: current plan card, progress/days remaining, renew flow, cancel action, invoices list.
- [ ] Checkout success/failure pages render correctly and maintain tenant branding.
- [ ] Notifications bell unread count and notifications page actions work.

---

### File Structure Summary

```
aqarify/
├── client/src/
│   ├── app/                       # router, layouts, providers
│   ├── components/shared/         # Sidebar, Topbar, CurrencyDisplay
│   ├── features/
│   │   ├── auth/                  # login, register, forgot-password, hooks
│   │   ├── landing/               # hero, navbar, amenities, contact, footer
│   │   ├── browse/                # filter bar, unit grid, cards
│   │   ├── unit-details/          # detail page, pricing, calculator
│   │   ├── reservation/           # checkout, success, hooks
│   │   ├── waiting-list/          # hooks
│   │   ├── customer-dashboard/    # overview, my reservations
│   │   ├── agent-dashboard/       # reservations, leads, follow-ups
│   │   ├── manager-dashboard/     # stats, units, waiting list
│   │   ├── admin/                 # settings (general, paymob, users)
│   │   └── notifications/         # notifications page
│   ├── hooks/                     # use-tenant, use-tenant-theme, use-debounce...
│   ├── lib/                       # api, supabase, utils, format
│   ├── stores/                    # auth, tenant, ui
│   └── i18n/                      # ar/, en/ JSON files
│
└── server/src/
    ├── config/                    # supabase admin
    ├── middleware/                # auth, tenant, rbac, errorHandler
    ├── routes/                    # auth, tenants, units, reservations,
    │                              # payments, waitingList, agent, manager,
    │                              # admin, notifications, webhooks
    ├── services/                  # reservation.service, paymob.service
    └── utils/                     # logger, response, hmac
```

### Decisions Log

| Date | Decision | Reasoning |
|------|----------|-----------|
| 2026-04-16 | Brand name: **Aqarify** | Arabic (عقار) root + global SaaS suffix, memorable, marketable |
| 2026-04-16 | Mapbox over Leaflet | Google-quality WebGL maps, 50k free loads/month |
| 2026-04-16 | Releans over Twilio | 15x cheaper for Egypt SMS ($0.0255 vs $0.39/msg) |
| 2026-04-16 | Shared DB + RLS | Most cost-effective multi-tenancy, Supabase RLS handles isolation |
| 2026-04-16 | React SPA not Next.js | User requested React+Vite, SEO via prerendering |
| 2026-04-16 | Paymob encrypted storage | API keys stored AES-256-CBC encrypted in DB column |
| 2026-04-16 | Webhook HMAC verify | Paymob callback authenticated via SHA-512 HMAC |
