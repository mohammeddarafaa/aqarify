import { useCallback, useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import type { BrowseFilters } from "@/features/browse/types";

// Query-string keys that are infrastructure, not unit filters. They must
// never leak into `filters` (otherwise the API gets `tenant=foo` etc. and
// the UI incorrectly reports "active filters").
const RESERVED = new Set(["tenant", "t", "as"]);

function applyFilterEntry(next: URLSearchParams, key: string, value: string) {
  if (RESERVED.has(key)) return;
  if (!value || value === "all") next.delete(key);
  else next.set(key, value);
}

export function useUnitFilters() {
  const { search } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Stable object when the query string is unchanged — avoids downstream
  // effects that depended on `[filters]` firing every parent re-render.
  const filters: BrowseFilters = useMemo(
    () =>
      Object.fromEntries(
        [...searchParams.entries()].filter(
          ([k, v]) => v !== "" && !RESERVED.has(k)
        )
      ),
    [search]
  );

  const setFilter = useCallback(
    (key: string, value: string) => {
      if (RESERVED.has(key)) return;
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        applyFilterEntry(next, key, value);
        return next;
      });
    },
    [setSearchParams]
  );

  /** Applies several filter keys in one navigation update (avoids clobbering with rapid setFilter calls). */
  const patchFilters = useCallback(
    (patch: Record<string, string>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) {
          applyFilterEntry(next, key, value);
        }
        return next;
      });
    },
    [setSearchParams]
  );

  const clearFilters = useCallback(
    () =>
      setSearchParams((prev) => {
        const next = new URLSearchParams();
        for (const key of RESERVED) {
          const existing = prev.get(key);
          if (existing) next.set(key, existing);
        }
        return next;
      }),
    [setSearchParams]
  );

  const hasActiveFilters = Object.values(filters).some(
    (v) => v && v !== "all" && v !== ""
  );

  return { filters, setFilter, patchFilters, clearFilters, hasActiveFilters };
}
