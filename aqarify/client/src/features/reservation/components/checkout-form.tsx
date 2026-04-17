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

const schema = z.object({
  full_name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Invalid phone"),
  payment_method: z.enum(["card", "fawry", "vodafone_cash", "bank_transfer"]),
  notes: z.string().optional(),
});

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
}

export function CheckoutForm({
  unitPrice,
  reservationFee,
  onSubmit,
  isLoading,
}: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(schema),
    defaultValues: { payment_method: "card" },
  });
  const selectedMethod = watch("payment_method");

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
          <Input id="phone" {...register("phone")} placeholder="01xxxxxxxxx" />
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
          <span>{unitPrice.toLocaleString()} EGP</span>
        </div>
        <div className="flex justify-between font-semibold text-primary">
          <span>Reservation fee due now</span>
          <span>{reservationFee.toLocaleString()} EGP</span>
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
