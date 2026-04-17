import { Resend } from "resend";
import axios from "axios";
import { supabaseAdmin } from "../config/supabase";
import { logger } from "../utils/logger";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RELEANS_KEY = process.env.RELEANS_API_KEY;
const RELEANS_SENDER = process.env.RELEANS_SENDER ?? "Aqarify";
const FROM_EMAIL = process.env.FROM_EMAIL ?? "noreply@aqarify.io";
let warnedMissingResend = false;

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

async function sendSMS(phone: string, message: string): Promise<boolean> {
  if (!RELEANS_KEY || !phone) return false;
  try {
    await axios.post(
      "https://api.releans.com/v2/message",
      { sender: RELEANS_SENDER, mobile: phone, content: message },
      { headers: { Authorization: `Bearer ${RELEANS_KEY}` } }
    );
    return true;
  } catch (err) {
    logger.error("Releans SMS error", err);
    return false;
  }
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!to) return false;
  const resend = getResendClient();
  if (!resend) return false;
  try {
    await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
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

  if (channels.includes("in_app")) {
    promises.push(createInAppNotif(payload));
  }

  if (channels.includes("sms") && payload.phone) {
    promises.push(sendSMS(payload.phone, `${payload.title}: ${payload.body}`));
  }

  if (channels.includes("email") && payload.email) {
    const { data: tenant } = await supabaseAdmin.from("tenants")
      .select("name").eq("id", payload.tenantId).single();
    const html = buildEmailHtml(payload.title, payload.body, tenant?.name);
    promises.push(sendEmail(payload.email, payload.title, html));
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
