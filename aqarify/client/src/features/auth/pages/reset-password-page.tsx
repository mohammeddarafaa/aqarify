import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/lib/app-toast";
import { supabase } from "@/lib/supabase";
import { Button, Input, Label } from "@/components/ui-kit";
import { appendTenantSearch } from "@/lib/tenant-path";

const schema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((v) => v.password === v.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    const { error: resetError } = await supabase.auth.updateUser({
      password: data.password,
    });
    setIsLoading(false);
    if (resetError) {
      toast.error(resetError.message);
      return;
    }
    setSuccess(true);
    toast.success("Password updated. Redirecting to login…");
    setTimeout(() => navigate(withTenant("/login")), 1200);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Set new password</h1>
        <p className="text-sm text-muted-foreground">Enter your new password to continue.</p>
      </div>

      {success ? (
        <p className="text-sm text-muted-foreground">Redirecting to login…</p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
        {errors.password ? <p className="text-xs text-destructive">{errors.password.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} />
        {errors.confirmPassword ? <p className="text-xs text-destructive">{errors.confirmPassword.message}</p> : null}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Saving..." : "Update password"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link to={withTenant("/login")} className="text-primary hover:underline">Back to login</Link>
      </p>
    </form>
  );
}
