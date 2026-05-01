import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useTenantStore } from "@/stores/tenant.store";
import { appendTenantSearch } from "@/lib/tenant-path";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const { t } = useTranslation();
  const { login, isLoading, resendSignupConfirmation, loginBlockedEmail } = useAuth();
  const [params] = useSearchParams();
  const { pathname, search } = useLocation();
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);
  const tenant = useTenantStore((s) => s.tenant);
  const isTeam = params.get("as") === "team";
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  return (
    <form
      onSubmit={handleSubmit((d) => login(d.email, d.password))}
      className="space-y-5"
    >
      {/* Tenant + audience badge */}
      <div
        className={cn(
          "flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium",
          isTeam
            ? "border-foreground/40 bg-foreground text-background"
            : "border-border bg-muted/50 text-muted-foreground"
        )}
      >
        {isTeam ? (
          <ShieldCheck className="size-3.5" />
        ) : (
          <Users className="size-3.5" />
        )}
        <span>
          {isTeam ? "دخول الفريق" : "دخول العملاء"}
          {tenant?.name ? ` · ${tenant.name}` : ""}
        </span>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">
          {isTeam ? "بوابة الموظفين" : t("nav.login")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isTeam
            ? "سجّل الدخول بحسابك كموظف مبيعات، مدير، أو مسؤول."
            : t("tagline")}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={cn(errors.email && "border-red-500")}
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-xs text-red-500">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            to={withTenant("/forgot-password")}
            className="text-xs text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className={cn(errors.password && "border-red-500")}
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-xs text-red-500">{errors.password.message}</p>
        ) : null}
      </div>

      {loginBlockedEmail ? (
        <div className="rounded-xl border border-amber-500/35 bg-amber-50/95 px-4 py-3 text-sm dark:bg-amber-950/35 dark:text-amber-50">
          <p className="text-amber-950 dark:text-amber-50">
            Confirm your email before signing in. We sent a link to{" "}
            <span className="font-mono font-medium">{loginBlockedEmail}</span>.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3 h-10 w-full rounded-full border-amber-600/50 text-xs font-semibold dark:border-amber-400/40"
            disabled={isLoading}
            onClick={() => void resendSignupConfirmation(loginBlockedEmail)}
          >
            Resend confirmation email
          </Button>
        </div>
      ) : null}

      <Button
        type="submit"
        className="h-11 w-full rounded-full text-sm font-semibold"
        disabled={isLoading}
      >
        {isLoading ? "Signing in..." : t("nav.login")}
      </Button>

      {isTeam ? (
        <p className="text-center text-xs text-muted-foreground">
          هل أنت عميل؟{" "}
          <Link to={withTenant("/login")} className="font-medium text-primary hover:underline">
            دخول العملاء
          </Link>
        </p>
      ) : (
        <>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              to={withTenant("/register")}
              className="font-medium text-primary hover:underline"
            >
              {t("nav.register")}
            </Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            للموظفين:{" "}
            <Link
              to={withTenant("/login?as=team")}
              className="font-medium text-foreground hover:underline"
            >
              دخول الفريق
            </Link>
          </p>
        </>
      )}
    </form>
  );
}
