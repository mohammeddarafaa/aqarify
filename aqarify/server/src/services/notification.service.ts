import { Resend } from "resend";
import axios from "axios";
import { supabaseAdmin } from "../config/supabase";
import { logger } from "../utils/logger";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RELEANS_KEY = process.env.RELEANS_API_KEY;
const RELEANS_SENDER = process.env.RELEANS_SENDER ?? "Aqarify";
const UNIFONIC_KEY = process.env.UNIFONIC_API_KEY;
const INFOBIP_KEY = process.env.INFOBIP_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL ?? "noreply@aqarify.io";
let warnedMissingResend = false;

interface TenantNotificationConfig {
  name?: string | null;
  country_code?: string | null;
  email_from_address?: string | null;
  email_from_name?: string | null;
  sms_sender_name?: string | null;
  notification_templates?: Record<string, { title?: string; body?: string }> | null;
}

function getResendClient(): Resend | null {
  if (!RESEND_API_KEY) {
    if (!warnedMissingResend) {
      logger.warn("RESEND_API_KEY is missing: email notifications are disabled.");
      warnedMissingResend = true;
    }
    return null;
  }
  return new Resend(RESEND_API_KEY);
}

export type NotifType =
  | "reservation_confirmed" | "reservation_cancelled" | "reservation_rejected"
  | "payment_due" | "payment_received" | "payment_overdue"
  | "waitlist_joined" | "waitlist_notified" | "waitlist_expired" | "waitlist_position_changed"
  | "document_required" | "document_approved" | "document_rejected"
  | "agent_assigned" | "daily_summary" | "low_inventory" | "general"
  | "subscription_expired" | "subscription_renewed" | "subscription_cancelled";

interface NotifPayload {
  tenantId: string;
  userId: string;
  type: NotifType;
  title: string;
  body: string;
  phone?: string;
  email?: string;
  channels?: ("sms" | "email" | "in_app")[];
  data?: Record<string, unknown>;
}

function selectSmsProvider(countryCode: string): "releans" | "unifonic" | "infobip" {
  const cc = countryCode.toUpperCase();
  if (cc === "EG") return "releans";
  if (["SA", "AE", "KW", "QA", "BH", "OM"].includes(cc)) return "unifonic";
  return "infobip";
}

function normalizedSmsSender(tenantSender?: string | null): string {
  const sender = (tenantSender ?? RELEANS_SENDER).trim();
  if (!sender) return "Aqarify";
  return sender.slice(0, 11);
}

async function sendViaReleans(phone: string, message: string, senderName?: string): Promise<boolean> {
  if (!RELEANS_KEY) return false;
  await axios.post(
    "https://api.releans.com/v2/message",
    { sender: normalizedSmsSender(senderName), mobile: phone, content: message },
    { headers: { Authorization: `Bearer ${RELEANS_KEY}` } },
  );
  return true;
}

async function sendViaUnifonic(phone: string, message: string, senderName?: string): Promise<boolean> {
  if (!UNIFONIC_KEY) {
    logger.warn("UNIFONIC_API_KEY missing: SMS skipped for non-EG route");
    return false;
  }
  await axios.post(
    "https://el.cloud.unifonic.com/rest/SMS/messages",
    { AppSid: UNIFONIC_KEY, Recipient: phone, Body: message, SenderID: normalizedSmsSender(senderName) },
    { headers: { Accept: "application/json", "Content-Type": "application/json" } },
  );
  return true;
}

async function sendViaInfobip(phone: string, message: string, senderName?: string): Promise<boolean> {
  if (!INFOBIP_KEY) {
    logger.warn("INFOBIP_API_KEY missing: SMS skipped for fallback route");
    return false;
  }
  await axios.post(
    "https://api.infobip.com/sms/2/text/advanced",
    { messages: [{ from: normalizedSmsSender(senderName), destinations: [{ to: phone }], text: message }] },
    { headers: { Authorization: `App ${INFOBIP_KEY}`, "Content-Type": "application/json" } },
  );
  return true;
}

async function sendSMS(phone: string, message: string, countryCode = "EG", senderName?: string): Promise<boolean> {
  if (!phone) return false;
  const provider = selectSmsProvider(countryCode);
  try {
    if (provider === "releans") return await sendViaReleans(phone, message, senderName);
    if (provider === "unifonic") return await sendViaUnifonic(phone, message, senderName);
    return await sendViaInfobip(phone, message, senderName);
  } catch (err) {
    logger.error(`SMS error (${provider})`, err);
    return false;
  }
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  fromAddress?: string | null,
  fromName?: string | null,
): Promise<boolean> {
  if (!to) return false;
  const resend = getResendClient();
  if (!resend) return false;
  try {
    const safeFromAddress = (fromAddress ?? FROM_EMAIL).trim() || FROM_EMAIL;
    const safeFromName = (fromName ?? "").trim();
    const from = safeFromName ? `${safeFromName} <${safeFromAddress}>` : safeFromAddress;
    await resend.emails.send({ from, to, subject, html });
    return true;
  } catch (err) {
    logger.error("Resend email error", err);
    return false;
  }
}

async function createInAppNotif(payload: NotifPayload) {
  const { error } = await supabaseAdmin.from("notifications").insert({
    tenant_id: payload.tenantId,
    user_id: payload.userId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    is_read: false,
  });
  if (error) logger.error("In-app notif error", error);
}

function buildEmailHtml(title: string, body: string, tenantName = "Aqarify"): string {
  return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><style>
    body{font-family:Cairo,Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;}
    .card{background:white;max-width:540px;margin:0 auto;padding:32px;border-top:3px solid #141414;}
    h1{color:#141414;font-size:18px;margin:0 0 12px;}
    p{color:#555;line-height:1.7;font-size:14px;}
    .brand{font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#999;margin-top:24px;border-top:1px solid #eee;padding-top:16px;}
  </style></head><body><div class="card">
    <h1>${title}</h1><p>${body}</p>
    <p class="brand">${tenantName}</p>
  </div></body></html>`;
}

export async function sendNotification(payload: NotifPayload): Promise<void> {
  const channels = payload.channels ?? ["in_app"];
  const promises: Promise<unknown>[] = [];
  const { data: tenant } = await supabaseAdmin
    .from("tenants")
    .select("name, country_code, email_from_address, email_from_name, sms_sender_name, notification_templates")
    .eq("id", payload.tenantId)
    .maybeSingle();
  const t = (tenant as TenantNotificationConfig | null) ?? null;
  const template = t?.notification_templates?.[payload.type];
  const title = template?.title?.trim() || payload.title;
  const body = template?.body?.trim() || payload.body;

  if (channels.includes("in_app")) {
    promises.push(createInAppNotif({ ...payload, title, body }));
  }

  if (channels.includes("sms") && payload.phone) {
    const cc = t?.country_code?.trim() || "EG";
    promises.push(sendSMS(payload.phone, `${title}: ${body}`, cc, t?.sms_sender_name ?? undefined));
  }

  if (channels.includes("email") && payload.email) {
    const html = buildEmailHtml(title, body, t?.name ?? "Aqarify");
    promises.push(sendEmail(payload.email, title, html, t?.email_from_address, t?.email_from_name));
  }

  await Promise.allSettled(promises);
  logger.info(`Notification sent: ${payload.type} to user ${payload.userId}`);
}

export async function sendBulkNotification(
  tenantId: string,
  userIds: string[],
  type: NotifType,
  title: string,
  body: string
): Promise<void> {
  const inserts = userIds.map((userId) => ({
    tenant_id: tenantId, user_id: userId, type, title, body, is_read: false,
  }));
  if (inserts.length > 0) {
    await supabaseAdmin.from("notifications").insert(inserts);
  }
}
