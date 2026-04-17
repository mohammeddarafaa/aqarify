import { supabaseAdmin } from "../config/supabase";
import { createPlatformPayment, isPlatformPaymentDevBypass } from "./platformPaymob.service";
import { logger } from "../utils/logger";

export interface SignupInput {
  company_name: string;
  slug: string;
  admin_email: string;
  admin_phone: string;
  admin_first_name: string;
  admin_last_name: string;
  plan_code: "starter" | "growth" | "pro";
  billing_cycle: "monthly" | "yearly";
}

export interface SignupResult {
  tenantId: string;
  subscriptionId: string;
  iframeUrl: string;
}

// Creates a pending-signup tenant + pending-payment subscription,
// then generates a Paymob iframe URL. Tenant is NOT usable until
// webhook confirms payment (see handlePlatformWebhook).
export async function createTenantSignup(input: SignupInput): Promise<SignupResult> {
  const { data: existing } = await supabaseAdmin
    .from("tenants")
    .select("id")
    .eq("slug", input.slug)
    .maybeSingle();
  if (existing) throw new Error("SLUG_TAKEN");

  const { data: plan, error: planErr } = await supabaseAdmin
    .from("subscription_plans")
    .select("id, price_egp_monthly, price_egp_yearly")
    .eq("code", input.plan_code)
    .eq("is_active", true)
    .single();
  if (planErr || !plan) throw new Error("PLAN_NOT_FOUND");

  const amount =
    input.billing_cycle === "yearly" ? plan.price_egp_yearly : plan.price_egp_monthly;

  const { data: tenant, error: tenantErr } = await supabaseAdmin
    .from("tenants")
    .insert({
      name: input.company_name,
      slug: input.slug,
      status: "pending_signup",
      contact_email: input.admin_email,
      contact_phone: input.admin_phone,
    })
    .select("id")
    .single();
  if (tenantErr || !tenant) throw new Error("TENANT_CREATE_FAILED");

  const { data: sub, error: subErr } = await supabaseAdmin
    .from("tenant_subscriptions")
    .insert({
      tenant_id: tenant.id,
      plan_id: plan.id,
      status: "pending_payment",
      billing_cycle: input.billing_cycle,
      amount_egp: amount,
    })
    .select("id")
    .single();
  if (subErr || !sub) throw new Error("SUBSCRIPTION_CREATE_FAILED");

  const paymob = await createPlatformPayment({
    amountEGP: Number(amount),
    merchantOrderId: sub.id,
    billingData: {
      first_name: input.admin_first_name,
      last_name: input.admin_last_name,
      email: input.admin_email,
      phone_number: input.admin_phone,
    },
  });

  await supabaseAdmin
    .from("tenant_subscriptions")
    .update({
      paymob_order_id: paymob.paymobOrderId,
      paymob_payment_key: paymob.paymentKey,
    })
    .eq("id", sub.id);

  // Dev bypass: if we're not hitting a real Paymob account, flip the tenant
  // to active immediately so the full flow works end-to-end locally.
  if (paymob.devBypass || isPlatformPaymentDevBypass()) {
    await activateSubscription(sub.id, `dev_${Date.now()}`, Number(amount));
  }

  return { tenantId: tenant.id, subscriptionId: sub.id, iframeUrl: paymob.iframeUrl };
}

// Activates a tenant after Paymob confirms the first subscription payment.
export async function activateSubscription(subscriptionId: string, paymobTxId: string, amountEgp: number) {
  const { data: sub } = await supabaseAdmin
    .from("tenant_subscriptions")
    .select("id, tenant_id, billing_cycle, status, current_period_end")
    .eq("id", subscriptionId)
    .single();
  if (!sub) throw new Error("SUBSCRIPTION_NOT_FOUND");

  if (sub.status === "active") {
    logger.info(`Subscription ${subscriptionId} already active — idempotent skip`);
    return;
  }

  const periodDays = sub.billing_cycle === "yearly" ? 365 : 30;
  const now = new Date();
  const currentEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
  const periodStart =
    currentEnd && currentEnd.getTime() > now.getTime() ? currentEnd : now;
  const periodEnd = new Date(periodStart.getTime() + periodDays * 86400000);

  await supabaseAdmin
    .from("tenant_subscriptions")
    .update({
      status: "active",
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", subscriptionId);

  await supabaseAdmin
    .from("tenants")
    .update({ status: "active" })
    .eq("id", sub.tenant_id);

  const { error: paymentErr } = await supabaseAdmin.from("platform_payments").insert({
    tenant_subscription_id: subscriptionId,
    tenant_id: sub.tenant_id,
    amount_egp: amountEgp,
    status: "succeeded",
    paymob_transaction_id: paymobTxId,
    hmac_verified_at: now.toISOString(),
    paid_at: now.toISOString(),
  });
  if (paymentErr && paymentErr.code !== "23505") throw paymentErr;

  logger.info(`Activated subscription ${subscriptionId} for tenant ${sub.tenant_id}`);
}

// Cancels the current subscription at period end (keeps access until then).
export async function cancelSubscription(tenantId: string) {
  const { data: sub } = await supabaseAdmin
    .from("tenant_subscriptions")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .single();
  if (!sub) throw new Error("NO_ACTIVE_SUBSCRIPTION");

  await supabaseAdmin
    .from("tenant_subscriptions")
    .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
    .eq("id", sub.id);

  return { id: sub.id, cancel_at_period_end: true };
}

export async function getCurrentSubscription(tenantId: string) {
  const { data } = await supabaseAdmin
    .from("tenant_subscriptions")
    .select("*, plan:subscription_plans(*)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function changeSubscriptionPlan(params: {
  tenantId: string;
  planCode: "starter" | "growth" | "pro";
  billingCycle?: "monthly" | "yearly";
}) {
  const current = await getCurrentSubscription(params.tenantId);
  if (!current) throw new Error("NO_SUBSCRIPTION");

  const billingCycle = params.billingCycle ?? current.billing_cycle;
  const { data: plan } = await supabaseAdmin
    .from("subscription_plans")
    .select("id, code, price_egp_monthly, price_egp_yearly")
    .eq("code", params.planCode)
    .eq("is_active", true)
    .single();
  if (!plan) throw new Error("PLAN_NOT_FOUND");

  const amount =
    billingCycle === "yearly" ? plan.price_egp_yearly : plan.price_egp_monthly;

  const { data, error } = await supabaseAdmin
    .from("tenant_subscriptions")
    .update({
      plan_id: plan.id,
      billing_cycle: billingCycle,
      amount_egp: amount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", current.id)
    .select("*, plan:subscription_plans(*)")
    .single();
  if (error || !data) throw new Error("PLAN_CHANGE_FAILED");
  return data;
}
