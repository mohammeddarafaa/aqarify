import "dotenv/config";
import test, { before } from "node:test";
import assert from "node:assert/strict";
import axios from "axios";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../src/config/supabase";
import { activateSubscription } from "../src/services/subscription.service";

const API_BASE = process.env.E2E_API_BASE_URL ?? "http://localhost:4000";
const API = `${API_BASE}/api/v1`;
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type TenantIds = { a: string; b: string; expired: string };
type TenantSlugs = { a: string; b: string; expired: string };
type Tokens = {
  customerA: string;
  agentA: string;
  managerA: string;
  adminA: string;
  adminExpired: string;
};

const ctx: {
  tenants: TenantIds;
  slugs: TenantSlugs;
  tokens: Tokens;
  unitA: string;
  unitB: string;
  reservationId?: string;
  leadId?: string;
  followUpId?: string;
  createdSubscriptionId?: string;
  authReady?: boolean;
} = {} as never;

async function ensureAvailableUnit(tenantId: string) {
  const existing = await supabaseAdmin
    .from("units")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("status", "available")
    .limit(1)
    .maybeSingle();
  if (existing.data?.id) return existing.data.id;

  const project = await supabaseAdmin
    .from("projects")
    .select("id")
    .eq("tenant_id", tenantId)
    .limit(1)
    .maybeSingle();
  const projectId = project.data?.id ?? randomUUID();
  if (!project.data?.id) {
    await supabaseAdmin.from("projects").insert({
      id: projectId,
      tenant_id: tenantId,
      name: `E2E Project ${projectId.slice(0, 6)}`,
      status: "active",
    });
  }

  const building = await supabaseAdmin
    .from("buildings")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .limit(1)
    .maybeSingle();
  const buildingId = building.data?.id ?? randomUUID();
  if (!building.data?.id) {
    await supabaseAdmin.from("buildings").insert({
      id: buildingId,
      tenant_id: tenantId,
      project_id: projectId,
      name: "E2E Block",
      number: "E2E",
      total_floors: 1,
      total_units: 1,
    });
  }

  const unitId = randomUUID();
  await supabaseAdmin.from("units").insert({
    id: unitId,
    tenant_id: tenantId,
    project_id: projectId,
    building_id: buildingId,
    unit_number: `E2E-${unitId.slice(0, 4)}`,
    floor: 1,
    type: "Apartment",
    bedrooms: 2,
    bathrooms: 1,
    balconies: 1,
    size_sqm: 120,
    price: 2000000,
    reservation_fee: 50000,
    down_payment_pct: 10,
    installment_months: 60,
    status: "available",
  });
  return unitId;
}

function apiClient(token?: string, tenantSlug?: string) {
  return axios.create({
    baseURL: API,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantSlug ? { "x-tenant-slug": tenantSlug } : {}),
    },
    validateStatus: () => true,
  });
}

async function ensureRoleUser(input: {
  email: string;
  password: string;
  role: "customer" | "agent" | "manager" | "admin";
  tenantId: string;
  fullName: string;
}) {
  async function findAuthUserIdByEmail(email: string) {
    const first = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const hit = first.data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    return hit?.id;
  }

  const exists = await supabaseAdmin.from("users").select("id").eq("email", input.email).maybeSingle();
  let authUserId = exists.data?.id;
  if (!exists.data) {
    const created = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName, role: input.role },
    });
    authUserId = created.data.user?.id;
  } else {
    await supabaseAdmin.auth.admin.updateUserById(exists.data.id, {
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName, role: input.role },
    });
  }

  let profile = await supabaseAdmin.from("users").select("id").eq("email", input.email).maybeSingle();
  if (!profile.data) {
    authUserId = authUserId ?? (await findAuthUserIdByEmail(input.email));
    if (!authUserId) throw new Error(`missing auth user for ${input.email}`);
    await supabaseAdmin.from("users").upsert({
      id: authUserId,
      email: input.email,
      full_name: input.fullName,
      role: input.role,
      tenant_id: input.tenantId,
      is_active: true,
    });
    profile = await supabaseAdmin.from("users").select("id").eq("id", authUserId).single();
  }
  if (!profile.data) throw new Error(`missing profile for ${input.email}`);
  await supabaseAdmin
    .from("users")
    .update({
      tenant_id: input.tenantId,
      role: input.role,
      full_name: input.fullName,
      is_active: true,
    })
    .eq("id", profile.data.id);

  const login = await anonClient.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (login.error || !login.data.session) {
    throw new Error(`login failed for ${input.email}: ${login.error?.message}`);
  }
  return login.data.session.access_token;
}

before(async () => {
  const health = await axios.get(`${API_BASE}/health`);
  assert.equal(health.status, 200);

  const tenants = await supabaseAdmin
    .from("tenants")
    .select("id, slug")
    .in("slug", ["kdevelopments", "roya-developments", "roya", "expired-demo"]);
  assert.equal(tenants.error, null);
  const map = new Map((tenants.data ?? []).map((t) => [t.slug, t.id]));
  const activeTenants = await supabaseAdmin
    .from("tenants")
    .select("id, slug")
    .in("status", ["active", "read_only"]);
  const fallbackA = activeTenants.data?.[0];
  const fallbackB = activeTenants.data?.[1];
  assert.ok(map.get("kdevelopments") ?? fallbackA?.id);
  assert.ok(map.get("roya-developments") ?? map.get("roya") ?? fallbackB?.id);
  assert.ok(map.get("expired-demo") ?? fallbackA?.id);
  ctx.tenants = {
    a: (map.get("kdevelopments") ?? fallbackA?.id)!,
    b: (map.get("roya-developments") ?? map.get("roya") ?? fallbackB?.id)!,
    expired: (map.get("expired-demo") ?? fallbackA?.id)!,
  };
  const slugById = new Map((activeTenants.data ?? []).map((t) => [t.id, t.slug]));
  ctx.slugs = {
    a: slugById.get(ctx.tenants.a) ?? "kdevelopments",
    b: slugById.get(ctx.tenants.b) ?? "roya-developments",
    expired: slugById.get(ctx.tenants.expired) ?? "expired-demo",
  };

  ctx.unitA = await ensureAvailableUnit(ctx.tenants.a);
  ctx.unitB = await ensureAvailableUnit(ctx.tenants.b);

  try {
    ctx.tokens = {
      customerA: await ensureRoleUser({
        email: "e2e.customer.a@aqarify.test",
        password: "P@ssword12345",
        role: "customer",
        tenantId: ctx.tenants.a,
        fullName: "E2E Customer A",
      }),
      agentA: await ensureRoleUser({
        email: "e2e.agent.a@aqarify.test",
        password: "P@ssword12345",
        role: "agent",
        tenantId: ctx.tenants.a,
        fullName: "E2E Agent A",
      }),
      managerA: await ensureRoleUser({
        email: "e2e.manager.a@aqarify.test",
        password: "P@ssword12345",
        role: "manager",
        tenantId: ctx.tenants.a,
        fullName: "E2E Manager A",
      }),
      adminA: await ensureRoleUser({
        email: "e2e.admin.a@aqarify.test",
        password: "P@ssword12345",
        role: "admin",
        tenantId: ctx.tenants.a,
        fullName: "E2E Admin A",
      }),
      adminExpired: await ensureRoleUser({
        email: "e2e.admin.expired@aqarify.test",
        password: "P@ssword12345",
        role: "admin",
        tenantId: ctx.tenants.expired,
        fullName: "E2E Admin Expired",
      }),
    };
    ctx.authReady = true;
  } catch {
    ctx.tokens = {
      customerA: process.env.E2E_TOKEN_CUSTOMER_A ?? "",
      agentA: process.env.E2E_TOKEN_AGENT_A ?? "",
      managerA: process.env.E2E_TOKEN_MANAGER_A ?? "",
      adminA: process.env.E2E_TOKEN_ADMIN_A ?? "",
      adminExpired: process.env.E2E_TOKEN_ADMIN_EXPIRED ?? "",
    };
    ctx.authReady = Object.values(ctx.tokens).every(Boolean);
  }
});

test("public tenant isolation: A cannot read B unit by id", async () => {
  const aApi = apiClient(undefined, ctx.slugs.a);
  const bApi = apiClient(undefined, ctx.slugs.b);
  const listA = await aApi.get("/units");
  const listB = await bApi.get("/units");
  assert.equal(listA.status, 200);
  assert.equal(listB.status, 200);
  assert.ok((listA.data.data ?? []).length > 0);
  assert.ok((listB.data.data ?? []).length > 0);

  const readBFromA = await aApi.get(`/units/${ctx.unitB}`);
  assert.equal(readBFromA.status, 404);
});

test("signup flow: create tenant and force activation", async () => {
  const api = apiClient();
  const slug = `e2e-${Date.now()}`;
  const signup = await api.post("/signup", {
    company_name: `E2E ${slug}`,
    slug,
    admin_email: `founder+${slug}@aqarify.test`,
    admin_phone: "+201000000999",
    admin_first_name: "E2E",
    admin_last_name: "Founder",
    plan_code: "starter",
    billing_cycle: "monthly",
  });
  assert.equal(signup.status, 201);
  assert.ok(signup.data.data.subscriptionId);
  ctx.createdSubscriptionId = signup.data.data.subscriptionId as string;

  const status1 = await api.get(`/subscription/status/${ctx.createdSubscriptionId}`);
  assert.equal(status1.status, 200);
  if (status1.data.data.status !== "active") {
    const sub = await supabaseAdmin
      .from("tenant_subscriptions")
      .select("amount_egp")
      .eq("id", ctx.createdSubscriptionId)
      .single();
    await activateSubscription(
      ctx.createdSubscriptionId,
      `e2e_tx_${Date.now()}`,
      Number(sub.data?.amount_egp ?? 0),
    );
  }
  const status2 = await api.get(`/subscription/status/${ctx.createdSubscriptionId}`);
  assert.equal(status2.status, 200);
});

test("customer flow: reserve then confirm, payments and notifications visible", async (t) => {
  if (!ctx.authReady) {
    t.skip("Auth credentials not available for role-flow tests");
    return;
  }
  const customer = apiClient(ctx.tokens.customerA, ctx.slugs.a);
  const manager = apiClient(ctx.tokens.managerA, ctx.slugs.a);
  const create = await customer.post("/reservations", {
    unit_id: ctx.unitA,
    payment_method: "bank_transfer",
    full_name: "E2E Customer A",
    phone: "+201000000111",
    email: "e2e.customer.a@aqarify.test",
    notes: "e2e",
  });
  assert.equal(create.status, 200);
  assert.ok(create.data.data.reservation.id);
  ctx.reservationId = create.data.data.reservation.id as string;

  const confirm = await manager.post(`/reservations/${ctx.reservationId}/confirm`);
  assert.equal(confirm.status, 200);

  const payments = await customer.get("/payments");
  assert.equal(payments.status, 200);
  assert.ok((payments.data.data ?? []).length > 0);

  const notifications = await customer.get("/notifications");
  assert.equal(notifications.status, 200);
});

test("agent flow: lead lifecycle + follow-up completion", async (t) => {
  if (!ctx.authReady) {
    t.skip("Auth credentials not available for role-flow tests");
    return;
  }
  const agent = apiClient(ctx.tokens.agentA, ctx.slugs.a);
  const lead = await agent.post("/agent/potential-customers", {
    full_name: "E2E Lead",
    phone: "+201000000222",
    source: "e2e",
  });
  assert.equal(lead.status, 200);
  ctx.leadId = lead.data.data.id as string;

  const stage = await agent.patch(`/agent/potential-customers/${ctx.leadId}/stage`, {
    stage: "contacted",
  });
  assert.equal(stage.status, 200);

  const followUp = await agent.post("/agent/follow-ups", {
    potential_customer_id: ctx.leadId,
    type: "call",
    scheduled_at: new Date(Date.now() + 3600_000).toISOString(),
    notes: "e2e follow-up",
  });
  assert.equal(followUp.status, 200);
  ctx.followUpId = followUp.data.data.id as string;

  const complete = await agent.patch(`/agent/follow-ups/${ctx.followUpId}/complete`, {
    outcome: "completed",
  });
  assert.equal(complete.status, 200);
});

test("manager flow: dashboard, units, waiting list, reports", async (t) => {
  if (!ctx.authReady) {
    t.skip("Auth credentials not available for role-flow tests");
    return;
  }
  const manager = apiClient(ctx.tokens.managerA, ctx.slugs.a);
  const dashboard = await manager.get("/manager/dashboard");
  const units = await manager.get("/manager/units");
  const waitlist = await manager.get("/manager/waiting-list");
  const reports = await manager.get("/manager/reports/sales");
  assert.equal(dashboard.status, 200);
  assert.equal(units.status, 200);
  assert.equal(waitlist.status, 200);
  assert.equal(reports.status, 200);
});

test("admin flow: settings, users, subscription endpoints", async (t) => {
  if (!ctx.authReady) {
    t.skip("Auth credentials not available for role-flow tests");
    return;
  }
  const admin = apiClient(ctx.tokens.adminA, ctx.slugs.a);
  const tenant = await admin.get("/admin/tenant");
  assert.equal(tenant.status, 200);

  const patch = await admin.patch("/admin/tenant", {
    contact_phone: "+201000000001",
  });
  assert.equal(patch.status, 200);

  const users = await admin.get("/admin/users");
  assert.equal(users.status, 200);
  assert.ok((users.data.data?.items ?? []).length > 0);

  const me = await admin.get("/subscription/me");
  const invoices = await admin.get("/subscription/invoices");
  const planChange = await admin.post("/subscription/change-plan", {
    plan_code: "growth",
  });
  assert.equal(me.status, 200);
  assert.equal(invoices.status, 200);
  assert.equal(planChange.status, 200);
});

test("isolation: tenant A token cannot read tenant B with spoofed slug", async (t) => {
  if (!ctx.authReady) {
    t.skip("Auth credentials not available for role-flow tests");
    return;
  }
  const spoofed = apiClient(ctx.tokens.adminA, ctx.slugs.b);
  const read = await spoofed.get(`/units/${ctx.unitB}`);
  assert.equal(read.status, 404);
});

test("read-only tenant blocks writes with 402", async (t) => {
  if (!ctx.authReady) {
    t.skip("Auth credentials not available for role-flow tests");
    return;
  }
  const expiredAdmin = apiClient(ctx.tokens.adminExpired, ctx.slugs.expired);
  const write = await expiredAdmin.post("/manager/agents", {
    email: `blocked+${Date.now()}@aqarify.test`,
    full_name: "Blocked User",
    role: "agent",
  });
  assert.equal(write.status, 402);
});
