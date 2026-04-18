import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  isAuthenticated: boolean;
  setSession: (user: AuthUser, token: string) => void;
  clearSession: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  updateToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setSession: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true }),
      clearSession: () =>
        set({ user: null, accessToken: null, isAuthenticated: false }),
      updateUser: (updates) =>
        set((s) => ({ user: s.user ? { ...s.user, ...updates } : null })),
      updateToken: (accessToken) =>
        set((s) => ({
          accessToken,
          isAuthenticated: !!accessToken && !!s.user,
        })),
    }),
    { name: "aqarify-auth" }
  )
);
