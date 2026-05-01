import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type UserRole =
  | "super_admin"
  | "admin"
  | "manager"
  | "agent"
  | "customer";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  tenant_id: string | null;
  /** Present when the user belongs to a tenant; used for apex / marketing login redirects. */
  tenant_slug?: string | null;
  avatar_url: string | null;
  phone: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  tokenExpiresAt: number | null;
  isAuthenticated: boolean;
  setSession: (user: AuthUser, token: string) => void;
  clearSession: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  updateToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => {
      const decodeExp = (token: string): number | null => {
        try {
          const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
          const exp = Number(payload?.exp);
          return Number.isFinite(exp) ? exp * 1000 : null;
        } catch {
          return null;
        }
      };
      const isExpired = (expiresAt: number | null): boolean =>
        typeof expiresAt === "number" && Date.now() >= expiresAt;

      return {
      user: null,
      accessToken: null,
      tokenExpiresAt: null,
      isAuthenticated: false,
      setSession: (user, accessToken) => {
        const tokenExpiresAt = decodeExp(accessToken);
        set({
          user,
          accessToken,
          tokenExpiresAt,
          isAuthenticated: !isExpired(tokenExpiresAt),
        });
      },
      clearSession: () =>
        set({ user: null, accessToken: null, tokenExpiresAt: null, isAuthenticated: false }),
      updateUser: (updates) =>
        set((s) => ({ user: s.user ? { ...s.user, ...updates } : null })),
      updateToken: (accessToken) =>
        set((s) => {
          const tokenExpiresAt = decodeExp(accessToken);
          return {
            accessToken,
            tokenExpiresAt,
            isAuthenticated: !!accessToken && !!s.user && !isExpired(tokenExpiresAt),
          };
        }),
    };
    },
    {
      name: "aqarify-auth",
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state) => {
        if (!state?.accessToken) return;
        if (typeof state.tokenExpiresAt === "number" && Date.now() >= state.tokenExpiresAt) {
          state.clearSession();
        } else {
          state.isAuthenticated = !!state.user;
        }
      },
    }
  )
);
