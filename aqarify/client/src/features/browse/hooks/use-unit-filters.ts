import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { BrowseFilters } from "@/features/browse/types";

// Query-string keys that are infrastructure, not unit filters. They must
// never leak into `filters` (otherwise the API gets `tenant=foo` etc. and
// the UI incorrectly reports "active filters").
const RESERVED = new Set(["tenant", "t", "as"]);

export function useUnitFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: BrowseFilters = Object.fromEntries(
    [...searchParams.entries()].filter(
      ([k, v]) => v !== "" && !RESERVED.has(k)
    )
  );

  const setFilter = useCallback(
    (key: string, value: string) => {
      if (RESERVED.has(key)) return;
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (!value || value === "all") next.delete(key);
        else next.set(key, value);
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

  return { filters, setFilter, clearFilters, hasActiveFilters };
}
