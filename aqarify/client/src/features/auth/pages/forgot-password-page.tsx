import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { appendTenantSearch } from "@/lib/tenant-path";

const schema = z.object({ email: z.string().email("Invalid email") });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { sendPasswordReset, isLoading } = useAuth();
  const { pathname, search } = useLocation();
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(d: FormData) {
    const ok = await sendPasswordReset(d.email);
    if (ok) setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto text-green-600 text-xl">✓</div>
        <h2 className="text-xl font-bold">Check your email</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          We sent a password reset link to your email.
        </p>
        <Link to={withTenant("/login")} className="text-[var(--color-primary)] hover:underline text-sm">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Reset Password</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" dir="ltr"
          className={errors.email ? "border-red-500" : ""} {...register("email")} />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <Button type="submit" className="h-11 w-full rounded-full text-sm font-semibold" disabled={isLoading}>
        {isLoading ? "Sending..." : "Send Reset Link"}
      </Button>

      <p className="text-center text-sm">
        <Link to={withTenant("/login")} className="text-[var(--color-primary)] hover:underline">Back to login</Link>
      </p>
    </form>
  );
}
