import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { BrowseFilters, Unit } from "@/features/browse/types";
import type { ApiSuccess, PaginationMeta } from "@/types/api.types";

const LIMIT = 12;

export function useUnitsQuery(filters: BrowseFilters) {
  return useInfiniteQuery<{ units: Unit[]; meta: PaginationMeta }>({
    queryKey: ["units", filters],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        ...Object.fromEntries(
          Object.entries(filters).filter(([, v]) => v && v !== "all")
        ),
        page: String(pageParam),
        limit: String(LIMIT),
      });
      const res = await api.get<ApiSuccess<Unit[]>>(`/units?${params}`);
      return {
        units: res.data.data,
        meta: res.data.meta as PaginationMeta,
      };
    },
    getNextPageParam: (last) =>
      last.meta.page < last.meta.total_pages ? last.meta.page + 1 : undefined,
  });
}
