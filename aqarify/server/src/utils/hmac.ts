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

function normalizeKeyBytes(k: string): Buffer {
  return Buffer.from(k.slice(0, 32).padEnd(32, "0"));
}

function aes256cbcEncrypt(plaintext: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", normalizeKeyBytes(key), iv);
  const body = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${body.toString("hex")}`;
}

function aes256cbcDecrypt(payload: string, key: string): string {
  const [ivHex, encHex] = payload.split(":");
  if (!ivHex || !encHex) throw new Error("Invalid ciphertext");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    normalizeKeyBytes(key),
    Buffer.from(ivHex, "hex"),
  );
  return Buffer.concat([decipher.update(Buffer.from(encHex, "hex")), decipher.final()]).toString("utf8");
}

/** `ENCRYPTION_KEYS=v1:32-byte-secret,v2:next-secret` or legacy `ENCRYPTION_KEY` (treated as v1). */
export function parseEncryptionKeyVersions(): Record<string, string> {
  const raw = process.env.ENCRYPTION_KEYS?.trim();
  const map: Record<string, string> = {};
  if (raw) {
    for (const token of raw.split(",")) {
      const t = token.trim();
      const idx = t.indexOf(":");
      if (idx <= 0) continue;
      const ver = t.slice(0, idx).trim();
      const secret = t.slice(idx + 1).trim();
      if (ver && secret) map[ver] = secret;
    }
  }
  if (Object.keys(map).length === 0 && process.env.ENCRYPTION_KEY) {
    map.v1 = process.env.ENCRYPTION_KEY;
  }
  if (Object.keys(map).length === 0) {
    throw new Error("Set ENCRYPTION_KEY or ENCRYPTION_KEYS");
  }
  return map;
}

function primaryEncryptKey(): string {
  const m = parseEncryptionKeyVersions();
  return m.v1 ?? m[Object.keys(m).sort()[0]];
}

/**
 * Encrypt for storage. Format: `v1:<iv_hex>:<ciphertext_hex>` (version prefix supports key rotation).
 * @param key — optional explicit key; defaults to primary v1 from env.
 */
export function encrypt(text: string, key?: string): string {
  const k = key ?? primaryEncryptKey();
  return `v1:${aes256cbcEncrypt(text, k)}`;
}

/**
 * Decrypt stored secrets. Supports versioned payloads and legacy `iv:cipher` without prefix
 * (tries all configured key versions).
 */
export function decrypt(encrypted: string, key?: string): string {
  if (key) {
    const inner = /^v\d+:/.test(encrypted) ? encrypted.replace(/^v\d+:/, "") : encrypted;
    return aes256cbcDecrypt(inner, key);
  }

  const versions = parseEncryptionKeyVersions();
  const verMatch = encrypted.match(/^(v\d+):(.+)$/);
  if (verMatch) {
    const ver = verMatch[1];
    const inner = verMatch[2];
    const k = versions[ver];
    if (!k) throw new Error(`Unknown encryption key version: ${ver}`);
    return aes256cbcDecrypt(inner, k);
  }

  for (const ver of Object.keys(versions).sort()) {
    try {
      return aes256cbcDecrypt(encrypted, versions[ver]);
    } catch {
      /* try next key */
    }
  }
  throw new Error("Could not decrypt with configured keys");
}
