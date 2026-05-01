import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "@/lib/app-toast";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { useFavoritesStore } from "@/stores/favorites.store";
import type { ApiSuccess } from "@/types/api.types";

const FAVORITES_QUERY_KEY = ["favorites"];

export function useFavorites() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const favoriteIds = useFavoritesStore((s) => s.localFavoriteUnitIds);
  const setLocalFavorites = useFavoritesStore((s) => s.setLocalFavorites);
  const lastSyncedUserId = useFavoritesStore((s) => s.lastSyncedUserId);
  const markSyncedForUser = useFavoritesStore((s) => s.markSyncedForUser);

  const syncTriggeredRef = useRef(false);

  const favoritesQuery = useQuery<string[]>({
    queryKey: FAVORITES_QUERY_KEY,
    enabled: isAuthenticated && !!user?.id,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<string[]>>("/favorites");
      return res.data.data ?? [];
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (unitIds: string[]) => {
      const res = await api.post<ApiSuccess<string[]>>("/favorites/sync", { unit_ids: unitIds });
      return res.data.data ?? [];
    },
    onSuccess: (serverIds) => {
      setLocalFavorites(serverIds);
      if (user?.id) markSyncedForUser(user.id);
    },
  });

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      syncTriggeredRef.current = false;
      return;
    }

    if (favoritesQuery.data && favoriteIds.length === 0) {
      setLocalFavorites(favoritesQuery.data);
      markSyncedForUser(user.id);
      return;
    }

    if (
      favoritesQuery.data &&
      favoriteIds.length > 0 &&
      lastSyncedUserId !== user.id &&
      !syncTriggeredRef.current &&
      !syncMutation.isPending
    ) {
      syncTriggeredRef.current = true;
      syncMutation.mutate([...new Set([...favoritesQuery.data, ...favoriteIds])]);
      return;
    }

  }, [
    favoriteIds,
    favoritesQuery.data,
    isAuthenticated,
    lastSyncedUserId,
    markSyncedForUser,
    setLocalFavorites,
    syncMutation.isPending,
    syncMutation.mutate,
    user?.id,
  ]);

  const toggleFavorite = async (unitId: string) => {
    const willBeFavorite = useFavoritesStore.getState().toggleLocalFavorite(unitId);
    if (!isAuthenticated) return willBeFavorite;

    try {
      if (willBeFavorite) {
        await api.post("/favorites", { unit_id: unitId });
      } else {
        await api.delete(`/favorites/${unitId}`);
      }
      return willBeFavorite;
    } catch {
      useFavoritesStore.getState().toggleLocalFavorite(unitId);
      toast.error("Could not update favorites. Please try again.");
      return !willBeFavorite;
    }
  };

  return {
    favoriteIds,
    isFavorite: (unitId: string) => favoriteIds.includes(unitId),
    toggleFavorite,
    isSyncing: favoritesQuery.isLoading || syncMutation.isPending,
  };
}
