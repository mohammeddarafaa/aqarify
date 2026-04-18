/**
 * Provisions demo auth users + sample CRM data for one tenant so you can click
 * through every role locally (customer, agent, manager, admin).
 *
 * Prereqs:
 *   - server/.env with SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (same project as the app)
 *   - If no row exists for the slug yet, this script inserts the canonical K-Developments tenant
 *     (same UUID/theme as supabase/seed.sql) so `/t/kdevelopments` and `/tenants/by-slug` work.
 *   - At least two available units (seed.sql or seed_kdevelopments_bulk.sql) for reservation/waitlist seeding
 *
 * Run from repo root:
 *   cd server && npx tsx scripts/seed-kdevelopments-demo.ts
 *
 * Env overrides:
 *   SEED_TENANT_SLUG=kdevelopments
 *   SEED_DEMO_PASSWORD=DemoKdev2026!
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TENANT_SLUG = process.env.SEED_TENANT_SLUG ?? "kdevelopments";
const PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "DemoKdev2026!";

if (!supabaseUrl || !serviceKey) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type DemoRole = "customer" | "agent" | "manager" | "admin";

const DEMO_USERS: { email: string; role: DemoRole; fullName: string }[] = [
  { email: "demo.customer@kdevelopments.test", role: "customer", fullName: "Demo Customer" },
  { email: "demo.agent@kdevelopments.test", role: "agent", fullName: "Demo Agent" },
  { email: "demo.manager@kdevelopments.test", role: "manager", fullName: "Demo Manager" },
  { email: "demo.admin@kdevelopments.test", role: "admin", fullName: "Demo Admin" },
];

async function findAuthUserIdByEmail(email: string) {
  const first = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  return first.data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;
}

/** Creates or updates auth + public.users; returns public.users id. */
async function ensureDemoUser(input: {
  email: string;
  password: string;
  role: DemoRole;
  tenantId: string;
  fullName: string;
}): Promise<string> {
  const exists = await admin.from("users").select("id").eq("email", input.email).maybeSingle();
  let authUserId = exists.data?.id;

  if (!exists.data) {
    const created = await admin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName, role: input.role },
    });
    authUserId = created.data.user?.id;
  } else {
    await admin.auth.admin.updateUserById(exists.data.id, {
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName, role: input.role },
    });
  }

  let profile = await admin.from("users").select("id").eq("email", input.email).maybeSingle();
  if (!profile.data) {
    authUserId = authUserId ?? (await findAuthUserIdByEmail(input.email));
    if (!authUserId) throw new Error(`missing auth user for ${input.email}`);
    await admin.from("users").upsert({
      id: authUserId,
      email: input.email,
      full_name: input.fullName,
      role: input.role,
      tenant_id: input.tenantId,
      is_active: true,
    });
    profile = await admin.from("users").select("id").eq("id", authUserId).single();
  }
  if (!profile.data) throw new Error(`missing profile for ${input.email}`);

  await admin
    .from("users")
    .update({
      tenant_id: input.tenantId,
      role: input.role,
      full_name: input.fullName,
      is_active: true,
    })
    .eq("id", profile.data.id);

  return profile.data.id;
}

/** Try lead shape matching the Express agent route (full_name + stage). */
async function insertLeads(
  tenantId: string,
  agentId: string,
): Promise<string | null> {
  const modern = {
    tenant_id: tenantId,
    assigned_agent_id: agentId,
    full_name: "عميل محتمل — تجربة",
    phone: "+201098765432",
    email: "lead.demo@example.com",
    source: "inquiry",
    stage: "contacted",
    notes: "بيانات تجريبية من seed-kdevelopments-demo",
  };

  let { data, error } = await admin.from("potential_customers").insert(modern).select("id").single();
  if (!error && data?.id) return data.id;

  const legacy = {
    tenant_id: tenantId,
    assigned_agent_id: agentId,
    name: modern.full_name,
    phone: modern.phone,
    email: modern.email,
    source: "inquiry" as const,
    negotiation_status: "contacted" as const,
    notes: modern.notes,
  };
  const second = await admin.from("potential_customers").insert(legacy).select("id").single();
  if (second.error) {
    console.warn("Could not insert potential_customers:", second.error.message);
    return null;
  }
  return second.data?.id ?? null;
}

async function main() {
  const { data: tenant, error: te } = await admin
    .from("tenants")
    .select("id, name, slug")
    .eq("slug", TENANT_SLUG)
    .single();

  if (te || !tenant) {
    console.error(`Tenant slug "${TENANT_SLUG}" not found. Create it first (see supabase/seed.sql).`);
    process.exit(1);
  }

  const tenantId = tenant.id;
  console.log(`Seeding demo for ${tenant.slug} (${tenantId})…`);

  const ids: Record<DemoRole, string> = {} as Record<DemoRole, string>;
  for (const u of DEMO_USERS) {
    ids[u.role] = await ensureDemoUser({
      email: u.email,
      password: PASSWORD,
      role: u.role,
      tenantId,
      fullName: u.fullName,
    });
    console.log(`  OK ${u.role}: ${u.email}`);
  }

  const { data: units } = await admin
    .from("units")
    .select("id, unit_number, price, status")
    .eq("tenant_id", tenantId)
    .eq("status", "available")
    .limit(5);

  if (!units?.length) {
    console.warn("No available units — add units (seed.sql / seed_kdevelopments_bulk.sql). Skipping reservation & waitlist.");
  } else {
    const u1 = units[0];
    const u2 = units[1] ?? units[0];

    const { count: existingRes } = await admin
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("customer_id", ids.customer)
      .eq("unit_id", u1.id)
      .eq("status", "pending");

    if (!existingRes) {
      const { error: re } = await admin.from("reservations").insert({
        tenant_id: tenantId,
        unit_id: u1.id,
        customer_id: ids.customer,
        agent_id: ids.agent,
        status: "pending",
        total_price: Number(u1.price),
        reservation_fee_paid: 0,
        payment_method: "bank_transfer",
        notes: "Demo reservation (seed script)",
      });
      if (re) console.warn("Reservation insert:", re.message);
      else console.log(`  OK pending reservation on unit ${u1.unit_number}`);
    }

    const { count: wlCount } = await admin
      .from("waiting_list")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("customer_id", ids.customer)
      .eq("unit_id", u2.id);

    if (!wlCount) {
      const { error: we } = await admin.from("waiting_list").insert({
        tenant_id: tenantId,
        customer_id: ids.customer,
        unit_id: u2.id,
        status: "waiting",
        notification_prefs: { sms: true, email: true },
      });
      if (we) console.warn("Waitlist insert:", we.message);
      else console.log(`  OK waitlist entry for unit ${u2.unit_number}`);
    }
  }

  const leadId = await insertLeads(tenantId, ids.agent);
  if (leadId) console.log("  OK sample lead (potential_customer)");

  if (leadId && units?.[0]) {
    const { error: ne } = await admin.from("negotiations").insert({
      tenant_id: tenantId,
      potential_customer_id: leadId,
      unit_id: units[0].id,
      offered_price: Number(units[0].price) * 0.95,
      discount_pct: 5,
      special_terms: "عرض تجريبي",
      status: "pending",
      created_by: ids.agent,
    });
    if (ne) console.warn("Negotiation insert:", ne.message);
    else console.log("  OK sample negotiation / offer");
  }

  const notifBase = {
    tenant_id: tenantId,
    type: "demo_seed",
    title: "إشعار تجريبي",
    message: "بيانات وهمية لاختبار الجرس والقائمة.",
    channel: "in_app" as const,
    status: "sent" as const,
    read_at: null as string | null,
  };

  for (const role of DEMO_USERS) {
    const uid = ids[role.role];
    const { error } = await admin.from("notifications").insert({ ...notifBase, user_id: uid });
    if (error) console.warn(`Notification for ${role.email}:`, error.message);
  }
  console.log("  OK notifications for each demo user (if schema matches)");

  console.log("\n── Log in at http://localhost:3000/?tenant=" + TENANT_SLUG);
  console.log("── Password for all demo accounts: " + PASSWORD);
  console.log("── Accounts:");
  for (const u of DEMO_USERS) {
    console.log(`     ${u.role.padEnd(10)} ${u.email}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
