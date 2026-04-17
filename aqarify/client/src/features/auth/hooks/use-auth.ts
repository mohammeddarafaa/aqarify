import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/lib/app-toast";
import { supabase } from "@/lib/supabase";

function isEmailNotConfirmedError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const o = err as { message?: string; code?: string };
  const msg = (o.message ?? "").toLowerCase();
  return (
    msg.includes("email not confirmed") ||
    msg.includes("not confirmed") ||
    o.code === "email_not_confirmed"
  );
}
import { api } from "@/lib/api";
import { useAuthStore, type AuthUser } from "@/stores/auth.store";
import type { ApiSuccess } from "@/types/api.types";
import { roleHomePath } from "@/lib/rbac";
import { isApexMarketingHost, resolveTenantSlug, resolveTenantSlugLive } from "@/lib/host";
import { appendTenantForSlug } from "@/lib/tenant-path";
import { useTenantStore } from "@/stores/tenant.store";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  /** Set when sign-in fails because Supabase requires a confirmed email */
  const [loginBlockedEmail, setLoginBlockedEmail] = useState<string | null>(null);
  const { setSession, clearSession } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname, search } = location;
  const withTenant = (path: string) => {
    const slug =
      resolveTenantSlugLive(pathname, search) ?? useTenantStore.getState().tenant?.slug ?? null;
    return appendTenantForSlug(slug, pathname, search, path);
  };

  async function login(email: string, password: string) {
    setIsLoading(true);
    setLoginBlockedEmail(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      const token = data.session!.access_token;
      const res = await api.get<ApiSuccess<AuthUser>>("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSession(res.data.data, token);

      const from = location.state?.from as
        | { pathname: string; search?: string; hash?: string }
        | undefined;
      if (
        from?.pathname &&
        from.pathname.startsWith("/") &&
        !from.pathname.startsWith("//")
      ) {
        navigate(`${from.pathname}${from.search ?? ""}${from.hash ?? ""}`, { replace: true });
        return;
      }

      navigate(withTenant(roleHomePath(res.data.data.role)));
    } catch (err: unknown) {
      if (isEmailNotConfirmedError(err)) {
        setLoginBlockedEmail(email);
        toast.warning(
          "This email isn’t confirmed yet. Open the link we sent you, or resend the confirmation email below.",
          { duration: 8000 },
        );
      } else {
        toast.error(err instanceof Error ? err.message : "Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function resendSignupConfirmation(forEmail: string) {
    const trimmed = forEmail.trim();
    if (!trimmed) {
      toast.error("Enter your email address first.");
      return;
    }
    setIsLoading(true);
    try {
      const slug =
        resolveTenantSlugLive(pathname, search) ?? useTenantStore.getState().tenant?.slug ?? null;
      const verifyRel = slug
        ? appendTenantForSlug(slug, pathname, search, "/login?verify=1")
        : "/login?verify=1";
      const emailRedirectTo = `${window.location.origin}${verifyRel}`;

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: trimmed,
        options: { emailRedirectTo },
      });
      if (error) throw error;
      toast.success("Confirmation email sent. Check your inbox (and spam).");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not resend confirmation email");
    } finally {
      setIsLoading(false);
    }
  }

  async function register(
    email: string,
    password: string,
    fullName: string,
    phone: string,
    opts?: {
      asTeam?: boolean;
      requestedRole?: "customer" | "agent" | "manager" | "admin";
    },
  ) {
    setIsLoading(true);
    try {
      const tenantSlug = resolveTenantSlug();
      if (opts?.asTeam && !tenantSlug) {
        toast.error("Open team registration from your company link (e.g. /t/your-company/register?as=team).");
        return;
      }
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            ...(tenantSlug ? { tenant_slug: tenantSlug } : {}),
            ...(opts?.asTeam && tenantSlug
              ? { role: opts.requestedRole && opts.requestedRole !== "customer" ? opts.requestedRole : "agent" }
              : { role: "customer" }),
          },
        },
      });
      if (authError) throw authError;
      if (data.session) {
        const token = data.session.access_token;
        await api.post("/auth/complete-profile", { phone }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const res = await api.get<ApiSuccess<AuthUser>>("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSession(res.data.data, token);
        navigate(withTenant(roleHomePath(res.data.data.role)));
      } else {
        const verifyPath = opts?.asTeam ? "/login?verify=1&as=team" : "/login?verify=1";
        navigate(withTenant(verifyPath));
        toast.info("Check your email to verify your account, then sign in.");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    clearSession();
    navigate(withTenant("/login"));
  }

  async function sendPasswordReset(email: string) {
    setIsLoading(true);
    try {
      const slug =
        resolveTenantSlugLive(pathname, search) ?? useTenantStore.getState().tenant?.slug ?? null;
      const resetPath =
        slug && isApexMarketingHost()
          ? `${window.location.origin}/t/${encodeURIComponent(slug)}/reset-password`
          : slug
            ? `${window.location.origin}/reset-password?tenant=${encodeURIComponent(slug)}`
            : `${window.location.origin}/reset-password`;
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetPath,
      });
      if (authError) throw authError;
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    login,
    register,
    logout,
    sendPasswordReset,
    resendSignupConfirmation,
    loginBlockedEmail,
    isLoading,
  };
}
