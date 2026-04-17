/**
 * Small pure validator used by the signup form + tested in isolation so
 * we never regress the portal-slug rules silently.
 */
export const SLUG_RE = /^[a-z0-9-]+$/;

export type SlugValidationResult =
  | { ok: true }
  | { ok: false; reason: "too-short" | "invalid-chars" | "leading-hyphen" };

export function validateSlug(slug: string): SlugValidationResult {
  if (slug.length < 3) return { ok: false, reason: "too-short" };
  if (!SLUG_RE.test(slug)) return { ok: false, reason: "invalid-chars" };
  if (slug.startsWith("-") || slug.endsWith("-"))
    return { ok: false, reason: "leading-hyphen" };
  return { ok: true };
}
