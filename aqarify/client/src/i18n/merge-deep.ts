/** Deep-merge plain JSON-like objects for i18n regional overrides. */
export function mergeDeep<T>(base: T, patch: Partial<T> | Record<string, unknown>): T {
  if (patch === undefined || patch === null) return structuredClone(base as object) as T;
  if (typeof patch !== "object" || Array.isArray(patch)) return patch as T;
  if (typeof base !== "object" || base === null || Array.isArray(base)) return patch as T;
  if (Object.keys(patch).length === 0) return structuredClone(base as object) as T;

  const out = structuredClone(base as object) as Record<string, unknown>;
  for (const [k, v] of Object.entries(patch)) {
    const prev = out[k];
    if (
      v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      prev &&
      typeof prev === "object" &&
      !Array.isArray(prev)
    ) {
      out[k] = mergeDeep(prev as Record<string, unknown>, v as Record<string, unknown>);
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out as T;
}
