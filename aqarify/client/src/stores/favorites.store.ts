import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type FavoritesState = {
  localFavoriteUnitIds: string[];
  compareUnitIds: string[];
  lastSyncedUserId: string | null;
  toggleLocalFavorite: (unitId: string) => boolean;
  setLocalFavorites: (unitIds: string[]) => void;
  markSyncedForUser: (userId: string) => void;
  clearSyncMarker: () => void;
  toggleCompareUnit: (unitId: string) => { selected: boolean };
  replaceCompareUnits: (ids: string[]) => void;
  removeCompareUnit: (unitId: string) => void;
  clearCompareUnits: () => void;
  isFavorite: (unitId: string) => boolean;
  isCompared: (unitId: string) => boolean;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      localFavoriteUnitIds: [],
      compareUnitIds: [],
      lastSyncedUserId: null,
      toggleLocalFavorite: (unitId) => {
        const exists = get().localFavoriteUnitIds.includes(unitId);
        set((state) => ({
          localFavoriteUnitIds: exists
            ? state.localFavoriteUnitIds.filter((id) => id !== unitId)
            : [...state.localFavoriteUnitIds, unitId],
        }));
        return !exists;
      },
      setLocalFavorites: (unitIds) => {
        set({ localFavoriteUnitIds: [...new Set(unitIds)] });
      },
      markSyncedForUser: (userId) => set({ lastSyncedUserId: userId }),
      clearSyncMarker: () => set({ lastSyncedUserId: null }),
      toggleCompareUnit: (unitId) => {
        const selected = get().compareUnitIds.includes(unitId);
        if (selected) {
          set((state) => ({ compareUnitIds: state.compareUnitIds.filter((id) => id !== unitId) }));
          return { selected: false };
        }
        set((state) => ({
          compareUnitIds: [...state.compareUnitIds, unitId],
        }));
        return { selected: true };
      },
      replaceCompareUnits: (ids) => {
        const seen = new Set<string>();
        const unique = ids.filter((id) => {
          if (!id || seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        set({ compareUnitIds: unique });
      },
      removeCompareUnit: (unitId) =>
        set((state) => ({ compareUnitIds: state.compareUnitIds.filter((id) => id !== unitId) })),
      clearCompareUnits: () => set({ compareUnitIds: [] }),
      isFavorite: (unitId) => get().localFavoriteUnitIds.includes(unitId),
      isCompared: (unitId) => get().compareUnitIds.includes(unitId),
    }),
    {
      name: "aqarify-favorites",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
