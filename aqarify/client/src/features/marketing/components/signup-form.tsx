import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2Icon, CheckIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { usePlans } from "../hooks/use-plans";
import { useSignup, useSlugAvailability, type SignupPayload } from "../hooks/use-signup";
import { validateSlug } from "./signup-validator";

export function SignupForm() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { data: plans } = usePlans();

  const [form, setForm] = useState<SignupPayload>({
    company_name: "",
    slug: "",
    admin_first_name: "",
    admin_last_name: "",
    admin_email: "",
    admin_phone: "",
    plan_code: (params.get("plan") as SignupPayload["plan_code"]) ?? "growth",
    billing_cycle: (params.get("cycle") as SignupPayload["billing_cycle"]) ?? "monthly",
  });

  const slugCheck = useSlugAvailability(form.slug);
  const signup = useSignup();

  function set<K extends keyof SignupPayload>(k: K, v: SignupPayload[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await signup.mutateAsync(form);
    navigate(`/signup/complete?subscription_id=${result.subscriptionId}&iframe=${encodeURIComponent(result.iframeUrl)}`);
  }

  const slugCheckResult = validateSlug(form.slug);
  const slugValid = slugCheckResult.ok;
  const slugAvailable = slugCheck.data?.available === true;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="first">First name</Label>
          <Input id="first" required value={form.admin_first_name}
            onChange={(e) => set("admin_first_name", e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="last">Last name</Label>
          <Input id="last" required value={form.admin_last_name}
            onChange={(e) => set("admin_last_name", e.target.value)} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="company">Company name</Label>
        <Input id="company" required placeholder="Your real-estate company"
          value={form.company_name} onChange={(e) => set("company_name", e.target.value)} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="slug">Portal subdomain</Label>
        <div className="flex items-stretch">
          <Input id="slug" required placeholder="acme" value={form.slug}
            className="rounded-e-none" onChange={(e) => set("slug", e.target.value.toLowerCase())} />
          <span className="inline-flex items-center rounded-e-md border border-s-0 border-input bg-muted px-3 text-sm text-muted-foreground">
            .aqarify.com
          </span>
        </div>
        {form.slug.length >= 3 ? (
          <div className={cn("flex items-center gap-1.5 text-xs",
            slugValid && slugAvailable ? "text-emerald-600" : "text-destructive")}>
            {slugValid && slugAvailable ? <CheckIcon className="size-3.5" /> : <XIcon className="size-3.5" />}
            {!slugValid
              ? slugCheckResult.ok === false && slugCheckResult.reason === "leading-hyphen"
                ? "Subdomain can't start or end with a hyphen"
                : "Lowercase letters, digits, and hyphens only"
              : slugCheck.isLoading
              ? "Checking..."
              : slugAvailable
              ? "Available"
              : "Already taken"}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" required value={form.admin_email}
            onChange={(e) => set("admin_email", e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" required placeholder="+2010..." value={form.admin_phone}
            onChange={(e) => set("admin_phone", e.target.value)} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Plan</Label>
        <RadioGroup value={form.plan_code}
          onValueChange={(v: string) => set("plan_code", v as SignupPayload["plan_code"])}
          className="grid gap-2 sm:grid-cols-3">
          {plans?.map((p) => (
            <label key={p.code} htmlFor={`p-${p.code}`}
              className={cn("flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                form.plan_code === p.code ? "border-foreground bg-muted/50" : "border-border hover:bg-muted/30")}>
              <RadioGroupItem id={`p-${p.code}`} value={p.code} />
              <div>
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">
                  {p.price_egp_monthly.toLocaleString("en-EG")} EGP/mo
                </div>
              </div>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="grid gap-2">
        <Label>Billing</Label>
        <RadioGroup value={form.billing_cycle}
          onValueChange={(v: string) => set("billing_cycle", v as SignupPayload["billing_cycle"])}
          className="grid gap-2 sm:grid-cols-2">
          {(["monthly", "yearly"] as const).map((c) => (
            <label key={c} htmlFor={`c-${c}`}
              className={cn("flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                form.billing_cycle === c ? "border-foreground bg-muted/50" : "border-border hover:bg-muted/30")}>
              <RadioGroupItem id={`c-${c}`} value={c} />
              <div className="text-sm font-medium capitalize">{c}{c === "yearly" ? " · save 17%" : ""}</div>
            </label>
          ))}
        </RadioGroup>
      </div>

      <Button type="submit" size="lg" className="w-full"
        disabled={signup.isPending || !slugValid || !slugAvailable}>
        {signup.isPending ? <Loader2Icon className="size-4 animate-spin" /> : null}
        Continue to payment
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Paymob-secured. Your subscription activates after successful payment.
      </p>
    </form>
  );
}
