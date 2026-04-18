/**
 * `receipt_url` on reservations may store a bucket-relative path (preferred)
 * or a legacy public URL from getPublicUrl(); normalize to the path in `documents`.
 */
export function receiptObjectPathFromStoredValue(stored: string | null | undefined): string | null {
  if (!stored?.trim()) return null;
  const t = stored.trim();
  if (t.startsWith("receipts/")) return t.split("?")[0] ?? null;
  const pub = "/object/public/documents/";
  const i = t.indexOf(pub);
  if (i !== -1) return (t.slice(i + pub.length).split("?")[0] ?? "").split("#")[0] || null;
  const sign = "/object/sign/documents/";
  const j = t.indexOf(sign);
  if (j !== -1) {
    const raw = t.slice(j + sign.length).split("?")[0] ?? "";
    try {
      return decodeURIComponent(raw.split("#")[0] || "") || null;
    } catch {
      return raw.split("#")[0] || null;
    }
  }
  return t.split("?")[0] ?? null;
}
