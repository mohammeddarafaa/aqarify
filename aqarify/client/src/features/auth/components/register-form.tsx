import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ShieldCheck, Users } from "lucide-react";
import { Button, Input, Label, cn } from "@/components/ui-kit";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { appendTenantSearch } from "@/lib/tenant-path";

const schema = z
  .object({
    full_name: z.string().min(2, "Name is required"),
    phone: z.string().min(10, "Valid phone required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "At least 8 characters"),
    confirm_password: z.string(),
    role: z.enum(["agent", "manager", "admin"]).optional(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

type FormData = z.infer<typeof schema>;

export function RegisterForm() {
  const { register: registerUser, isLoading } = useAuth();
  const { pathname, search } = useLocation();
  const [params] = useSearchParams();
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);
  const isTeam = params.get("as") === "team";
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  return (
    <form
      onSubmit={handleSubmit((d) =>
        registerUser(d.email, d.password, d.full_name, d.phone, {
          asTeam: isTeam,
          requestedRole: isTeam ? d.role ?? "agent" : "customer",
        }),
      )}
      className="space-y-4"
    >
      <div
        className={cn(
          "flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium w-fit",
          isTeam
            ? "border-foreground/40 bg-foreground text-background"
            : "border-border bg-muted/50 text-muted-foreground",
        )}
      >
        {isTeam ? (
          <ShieldCheck className="size-3.5 shrink-0" />
        ) : (
          <Users className="size-3.5 shrink-0" />
        )}
        <span>{isTeam ? "تسجيل موظف (وكيل مبيعات)" : "تسجيل عميل"}</span>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">
          {isTeam ? "إنشاء حساب فريق" : "Create account"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isTeam
            ? "سجّل كوكيل مبيعات على بوابة شركتك. المديرون يُضافون من لوحة الإدارة."
            : "Join and start browsing units"}
        </p>
      </div>

      {isTeam ? (
        <div className="space-y-2">
          <Label htmlFor="role">الدور</Label>
          <select
            id="role"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            defaultValue="agent"
            {...register("role")}
          >
            <option value="agent">موظف مبيعات</option>
            <option value="manager">مدير مبيعات</option>
            <option value="admin">مسؤول المنصة</option>
          </select>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            placeholder="Mohamed Ahmed"
            className={cn(errors.full_name && "border-red-500")}
            {...register("full_name")}
          />
          {errors.full_name ? (
            <p className="text-xs text-red-500">{errors.full_name.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+201000000000"
            dir="ltr"
            className={cn(errors.phone && "border-red-500")}
            {...register("phone")}
          />
          {errors.phone ? (
            <p className="text-xs text-red-500">{errors.phone.message}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          dir="ltr"
          className={cn(errors.email && "border-red-500")}
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-xs text-red-500">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            className={cn(errors.password && "border-red-500")}
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm_password">Confirm password</Label>
          <Input
            id="confirm_password"
            type="password"
            placeholder="••••••••"
            className={cn(errors.confirm_password && "border-red-500")}
            {...register("confirm_password")}
          />
          {errors.confirm_password ? (
            <p className="text-xs text-red-500">
              {errors.confirm_password.message}
            </p>
          ) : null}
        </div>
      </div>

      <Button
        type="submit"
        className="h-11 w-full rounded-full text-sm font-semibold"
        disabled={isLoading}
      >
        {isLoading ? "Creating account..." : isTeam ? "إنشاء حساب" : "Create account"}
      </Button>

      {isTeam ? (
        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link
            to={withTenant("/login?as=team")}
            className="font-medium text-primary hover:underline"
          >
            Team sign in
          </Link>
          {" · "}
          <Link to={withTenant("/register")} className="font-medium text-foreground hover:underline">
            Customer sign up
          </Link>
        </p>
      ) : (
        <>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to={withTenant("/login")}
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            للموظفين:{" "}
            <Link
              to={withTenant("/register?as=team")}
              className="font-medium text-foreground hover:underline"
            >
              تسجيل فريق
            </Link>
          </p>
        </>
      )}
    </form>
  );
}
