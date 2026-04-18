import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Textarea,
  cn,
} from "@/components/ui-kit";
import type { CheckoutFormData } from "../types";
import { useTenantStore } from "@/stores/tenant.store";
import { useAuthStore } from "@/stores/auth.store";
import { formatCurrency } from "@/lib/format";

function buildCheckoutSchema(countryCode: string) {
  return z.object({
    full_name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().min(1, "Phone is required").refine(
      (v) => {
        const clean = v.replace(/[^\d+]/g, "");
        return clean.length >= 8 && clean.length <= 20;
      },
      { message: "Invalid phone number format" },
    ),
    payment_method: z.enum(["card", "fawry", "vodafone_cash", "bank_transfer"]),
    notes: z.string().optional(),
  });
}

const METHODS = [
  { value: "card", label: "Credit / Debit card", icon: "💳" },
  { value: "fawry", label: "Fawry", icon: "🏪" },
  { value: "vodafone_cash", label: "Vodafone Cash", icon: "📱" },
  { value: "bank_transfer", label: "Bank transfer", icon: "🏦" },
] as const;

interface Props {
  unitPrice: number;
  reservationFee: number;
  onSubmit: (data: CheckoutFormData) => void;
  isLoading: boolean;
  /** Shown when customer selects bank transfer (from tenant settings). */
  bankTransfer?: {
    bank_name: string | null;
    bank_account_number: string | null;
    bank_account_holder: string | null;
  };
}

export function CheckoutForm({
  unitPrice,
  reservationFee,
  onSubmit,
  isLoading,
  bankTransfer,
}: Props) {
  const tenant = useTenantStore((s) => s.tenant);
  const countryCode = tenant?.country_code ?? "EG";
  const currency = tenant?.currency ?? "EGP";
  const schema = useMemo(() => buildCheckoutSchema(countryCode), [countryCode]);

  const user = useAuthStore((s) => s.user);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      payment_method: "card",
      full_name: user?.full_name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
    },
  });
  const selectedMethod = watch("payment_method");

  const phonePlaceholder =
    countryCode === "EG"
      ? "01xxxxxxxxx"
      : countryCode === "SA"
        ? "05xxxxxxxx"
        : "+971…";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" {...register("full_name")} placeholder="Ahmed Mohamed" />
          {errors.full_name ? (
            <p className="text-xs text-red-500">{errors.full_name.message}</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} placeholder={phonePlaceholder} dir="ltr" />
          {errors.phone ? (
            <p className="text-xs text-red-500">{errors.phone.message}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register("email")} placeholder="you@example.com" />
        {errors.email ? (
          <p className="text-xs text-red-500">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-3">
        <Label>Payment method</Label>
        <RadioGroup
          value={selectedMethod}
          onValueChange={(v: string) =>
            setValue("payment_method", v as CheckoutFormData["payment_method"])
          }
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {METHODS.map((m) => (
            <label
              key={m.value}
              htmlFor={`pm-${m.value}`}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 p-3 text-sm font-medium transition-all",
                selectedMethod === m.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/40",
              )}
            >
              <RadioGroupItem
                id={`pm-${m.value}`}
                value={m.value}
                className="sr-only"
              />
              <span className="text-xl">{m.icon}</span>
              <span>{m.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      {selectedMethod === "bank_transfer" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="font-medium">Bank transfer</p>
          <p className="mt-1 text-xs opacity-90">
            After you confirm, you will see our bank details and your reference number. Transfer the reservation fee, then upload the receipt from your dashboard → Documents.
          </p>
          {bankTransfer?.bank_account_number ? (
            <ul className="mt-3 space-y-1 text-xs font-mono">
              {bankTransfer.bank_name ? <li>Bank: {bankTransfer.bank_name}</li> : null}
              {bankTransfer.bank_account_holder ? (
                <li>Beneficiary: {bankTransfer.bank_account_holder}</li>
              ) : null}
              <li>Account: {bankTransfer.bank_account_number}</li>
            </ul>
          ) : (
            <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">
              This workspace has not published bank details yet; you will still get a reference number on the next screen—please contact the sales team if you need account info.
            </p>
          )}
        </div>
      ) : null}

      <div className="space-y-1">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          rows={2}
          placeholder="Any additional notes..."
        />
      </div>

      <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Unit price</span>
          <span>{formatCurrency(unitPrice, currency, "en")}</span>
        </div>
        <div className="flex justify-between font-semibold text-primary">
          <span>Reservation fee due now</span>
          <span>{formatCurrency(reservationFee, currency, "en")}</span>
        </div>
      </div>

      <Button
        type="submit"
        className="h-12 w-full rounded-full text-sm font-semibold"
        disabled={isLoading}
      >
        {isLoading ? "Processing..." : "Confirm reservation"}
      </Button>
    </form>
  );
}
