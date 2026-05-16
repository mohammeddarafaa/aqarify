# Aqarify — Production Readiness Specification

**Feature ID:** 001  
**Feature Name:** production-readiness  
**Status:** In Review  
**Last Updated:** 2026-05-15

---

## Overview

Aqarify is a multi-tenant SaaS real-estate reservation platform for the Egyptian and Gulf markets.
It allows property companies (tenants) to publish unit listings, collect reservations, process payments
through Paymob or bank transfer, and manage their sales pipeline through role-based dashboards
(Customer, Agent, Manager, Admin, Super Admin).

The platform is built and partially deployed but has **40 identified gaps** across backend, frontend,
database, and infrastructure layers that block a safe production launch. This specification defines
every user journey that must work correctly before any real tenant uses the system with real customer data.

---

## Problem Statement

The current codebase has:

1. **Money-loss risks:** Unit double-reservation race conditions, webhook replaying charges, no atomic status transitions.
2. **Tenant data leakage risks:** Missing tenant scopes on reservation routes, hardcoded demo data exposed to real customers.
3. **Silent failures:** Domain event handlers that log but do nothing; idempotency table that exists but is never used.
4. **Operational blind spots:** No health endpoints, no graceful shutdown, no request-ID tracing, no CI/CD pipeline.
5. **UI stubs in production paths:** Admin, manager, and platform-admin dashboards showing hardcoded or empty data.

---

## Users & Roles

| Role | Who They Are | Primary Goals |
|------|-------------|---------------|
| **Customer** | Home buyer or renter | Browse units, reserve, pay, track status, join waitlist |
| **Agent** | Sales staff at tenant company | Confirm reservations, manage leads, schedule follow-ups |
| **Manager** | Sales manager at tenant company | View KPIs, approve cancellations, generate reports |
| **Admin** | Tenant company admin | Configure Paymob, manage users, control branding |
| **Super Admin** | Aqarify internal staff | Manage all tenants, suspend/activate, view cross-tenant metrics |
| **Platform** | Automated system | Run cron jobs, process webhooks, send notifications |

---

## User Stories

### US-01 · Customer Reservation Journey

**As a customer,** I want to browse available units and complete a reservation so that I can secure my chosen property.

**Acceptance Criteria:**
- [ ] I can filter units by project, type, floor, price range, and availability status.
- [ ] I can view a unit detail page with photos, specifications, and a reservation button.
- [ ] When I click Reserve, I am shown a checkout page with the correct reservation fee for this tenant's Paymob account — not a shared global key.
- [ ] I can pay by card (Paymob iframe) or bank transfer (upload receipt).
- [ ] After successful payment, I see a success page with my confirmation number and a working Download Receipt button.
- [ ] Two customers attempting to reserve the same unit simultaneously result in exactly one successful reservation; the second receives a "unit not available" error.
- [ ] The unit's status changes to `reserved` atomically at the moment of reservation — not after a separate update step.

---

### US-02 · Customer Waitlist Journey

**As a customer,** I want to join a waitlist for a reserved unit so that I am notified when it becomes available.

**Acceptance Criteria:**
- [ ] I can join a waitlist for any unit currently in `reserved` status.
- [ ] I receive an in-app notification within 1 second when the unit becomes available (via Supabase Realtime, not polling).
- [ ] The notification includes a countdown showing I have 24 hours to reserve.
- [ ] If my 24-hour window expires, the next person on the waitlist is automatically notified.
- [ ] The waitlist timer cron job fires correctly and uses an atomic database lock (no duplicate firings across server replicas).

---

### US-03 · Webhook Payment Confirmation

**As the platform,** I need to reliably process Paymob payment webhook callbacks so that reservations are confirmed and customers are notified — exactly once, even if Paymob retries the same event.

**Acceptance Criteria:**
- [ ] Incoming webhook HMAC signature is verified using the correct per-tenant Paymob secret.
- [ ] A webhook with an invalid HMAC returns HTTP 200 (not 401) and logs the anomaly — the endpoint is not fingerprinted.
- [ ] A webhook with a valid HMAC but a transaction ID already in `webhook_events` table is silently acknowledged (HTTP 200, no re-processing).
- [ ] A successfully processed webhook inserts the transaction ID into `webhook_events` before any side effects occur.
- [ ] The webhook endpoint is rate-limited to 120 requests per minute.
- [ ] On successful confirmation: unit status becomes `sold`, reservation status becomes `confirmed`, customer receives in-app notification, an agent is auto-assigned.

---

### US-04 · Agent Reservation Management

**As an agent,** I want to view and manage reservations assigned to me so that I can move deals forward.

**Acceptance Criteria:**
- [ ] I can see only reservations belonging to my tenant — not those of other tenants.
- [ ] I can confirm a pending bank-transfer reservation after verifying the uploaded receipt.
- [ ] I can reject a reservation with a reason; the customer is notified and a lead is automatically created for follow-up.
- [ ] I can view and create follow-up tasks; the follow-up status column (`scheduled`, `completed`, `cancelled`) is present and functional.
- [ ] Confirming a reservation triggers the `reservation.confirmed` domain event, which sends a notification and assigns an agent if none is set.

---

### US-05 · Manager Dashboard & Reports

**As a manager,** I want to see live KPI metrics for my portfolio so that I can make informed decisions.

**Acceptance Criteria:**
- [ ] The overview page shows 4 live KPI cards: total units, reserved units, sold units, and revenue — sourced from the API, not hardcoded.
- [ ] No placeholder or demo numbers appear for a new tenant with zero data; empty states are shown instead.
- [ ] I can access all manager routes and report routes — super admin role also has access to all of these.

---

### US-06 · Admin Tenant Configuration

**As an admin,** I want to configure my tenant's Paymob credentials and branding so that payments and the customer-facing interface work correctly for my company.

**Acceptance Criteria:**
- [ ] I can save my Paymob API key, secret, and iframe ID; these are stored AES-256-CBC encrypted per-tenant with a versioned key.
- [ ] Encrypting with key version `v1` and decrypting later works. After a key rotation to `v2`, old `v1` credentials still decrypt correctly.
- [ ] If I let my subscription lapse, write endpoints return 402 and the `ReadOnlyBanner` is shown; read-only access still works.

---

### US-07 · Platform Admin Cross-Tenant Management

**As a super admin,** I want to see all tenants and manage their status so that I can operate the platform.

**Acceptance Criteria:**
- [ ] The platform admin dashboard shows all tenants with their plan, status (`active`, `trial`, `read_only`, `suspended`), and last activity date — sourced from the API.
- [ ] I can suspend or activate a tenant from the dashboard.
- [ ] No hardcoded data appears in this view.

---

### US-08 · Operational Safety

**As an operator,** I need the server to behave safely under load, restart, and deployment scenarios.

**Acceptance Criteria:**
- [ ] `GET /health` returns HTTP 200 in < 10 ms with no database call.
- [ ] `GET /ready` returns HTTP 200 when the database is reachable, 503 otherwise.
- [ ] Sending `SIGTERM` to the server allows in-flight requests to complete (up to 30 s) before exit.
- [ ] With 3 server replicas running, each cron job fires exactly once per window — not 3 times.
- [ ] The server refuses to start if `ENCRYPTION_KEY` is missing or not exactly 32 characters.
- [ ] Every HTTP request log line contains a unique `reqId` that can be used to trace the full request lifecycle in log aggregation.

---

### US-09 · Notification Delivery

**As a customer or agent,** I want to receive real-time in-app notifications for important events so that I do not miss time-sensitive updates.

**Acceptance Criteria:**
- [ ] The notification bell updates within ~1 second of a new notification being inserted (Supabase Realtime, not 60-second polling).
- [ ] Confirming a reservation sends a notification to the customer.
- [ ] Cancelling a reservation sends a notification to the customer and notifies the next person on the waitlist.
- [ ] A new reservation sends a notification to the assigned agent.

---

## Out of Scope (for this launch)

- SMS/email notifications via Releans/Resend (infrastructure wired, content TBD post-launch).
- PWA offline support.
- API documentation (Swagger/OpenAPI) — planned for first 10-tenant milestone.
- E2E test automation with Playwright — targeted for first 10-tenant milestone.

---

## Review & Acceptance Checklist

- [ ] All 9 user stories have clearly testable acceptance criteria.
- [ ] No implementation details (function names, DB column names) appear in this spec.
- [ ] Each user story is written from the user's perspective, not the system's.
- [ ] Edge cases (concurrent requests, duplicate webhooks, expired subscriptions) are covered in acceptance criteria.
- [ ] The out-of-scope section is explicit to prevent scope creep.
- [ ] All roles are defined and their primary goals are clear.
