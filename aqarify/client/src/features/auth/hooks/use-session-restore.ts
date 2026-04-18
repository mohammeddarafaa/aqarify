import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { useAuthStore, type AuthUser } from "@/stores/auth.store";
import type { ApiSuccess } from "@/types/api.types";

export function useSessionRestore() {
  const { setSession, clearSession, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // On mount, check if supabase has an active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { clearSession(); return; }
      try {
        const res = await api.get<ApiSuccess<AuthUser>>("/auth/me", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        setSession(res.data.data, session.access_token);
      } catch {
        clearSession();
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          clearSession();
          return;
        }
        if (event === "TOKEN_REFRESHED" && session.access_token) {
          const { user } = useAuthStore.getState();
          if (user) useAuthStore.getState().updateToken(session.access_token);
        }
      }
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isAuthenticated };
}
