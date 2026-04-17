import crypto from "crypto";

export function verifyPaymobHmac(payload: Record<string, unknown>, receivedHmac: string, secret: string): boolean {
  const keys = [
    "amount_cents","created_at","currency","error_occured","has_parent_transaction",
    "id","integration_id","is_3d_secure","is_auth","is_capture","is_refunded",
    "is_standalone_payment","is_voided","order","owner","pending","source_data_pan",
    "source_data_sub_type","source_data_type","success",
  ];
  const str = keys.map((k) => String((payload as Record<string, unknown>)[k] ?? "")).join("");
  const hash = crypto.createHmac("sha512", secret).update(str).digest("hex");
  return hash === receivedHmac;
}

/** Flat query keys from Paymob's browser redirect (e.g. `source_data.pan`) → HMAC payload. */
export function paymobReturnFlatToHmacPayload(flat: Record<string, string>): Record<string, unknown> {
  const g = (k: string) => flat[k] ?? "";
  const dot = (a: string, b: string) => flat[`${a}.${b}`] ?? "";
  return {
    amount_cents: g("amount_cents"),
    created_at: g("created_at"),
    currency: g("currency"),
    error_occured: g("error_occured"),
    has_parent_transaction: g("has_parent_transaction"),
    id: g("id"),
    integration_id: g("integration_id"),
    is_3d_secure: g("is_3d_secure"),
    is_auth: g("is_auth"),
    is_capture: g("is_capture"),
    is_refunded: g("is_refunded"),
    is_standalone_payment: g("is_standalone_payment"),
    is_voided: g("is_voided"),
    order: g("order"),
    owner: g("owner"),
    pending: g("pending"),
    source_data_pan: dot("source_data", "pan"),
    source_data_sub_type: dot("source_data", "sub_type"),
    source_data_type: dot("source_data", "type"),
    success: g("success"),
  };
}

export function encrypt(text: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key.padEnd(32).slice(0, 32)), iv);
  return iv.toString("hex") + ":" + Buffer.concat([cipher.update(text), cipher.final()]).toString("hex");
}

export function decrypt(encrypted: string, key: string): string {
  const [ivHex, encHex] = encrypted.split(":");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key.padEnd(32).slice(0, 32)), Buffer.from(ivHex, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(encHex, "hex")), decipher.final()]).toString();
}
