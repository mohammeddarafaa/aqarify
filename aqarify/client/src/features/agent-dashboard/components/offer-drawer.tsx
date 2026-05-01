import { useEffect } from "react";
import type { Unit } from "@/features/browse/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { toast } from "@/lib/app-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useIsReadOnly } from "@/hooks/use-is-read-only";

type NegotiationOffer = {
  id: string;
  unit_id: string;
  offered_price: number;
  discount_pct: number | null;
  special_terms: string | null;
  status: string;
  created_at: string;
  units?: { unit_number: string; type: string; price: number };
};

const offerFormSchema = z.object({
  unit_id: z.string().uuid(),
  offered_price: z.coerce.number().positive(),
  discount_pct: z.coerce.number().min(0).max(100).optional(),
  special_terms: z.string().optional(),
});

type OfferForm = z.infer<typeof offerFormSchema>;

export function OfferDrawer({
  leadId,
  open,
  onOpenChange,
}: {
  leadId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const readOnly = useIsReadOnly();
  const id = leadId ?? "";

  const { data: units = [] } = useQuery({
    queryKey: ["units-for-offers"],
    queryFn: async () => {
      const r = await api.get(`/units?limit=50&status=available`);
      return (r.data.data as Unit[]) ?? [];
    },
    enabled: open,
  });

  const { data: offers = [] } = useQuery({
    queryKey: ["negotiation-offers", id],
    queryFn: async () => (await api.get(`/negotiations/${id}/offers`)).data.data as NegotiationOffer[],
    enabled: open && !!id,
  });

  const form = useForm<OfferForm>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: { unit_id: "", offered_price: 0, discount_pct: undefined, special_terms: "" },
  });
  const { reset } = form;

  useEffect(() => {
    if (open && units[0]?.id) {
      reset({
        unit_id: units[0].id,
        offered_price: Number(units[0].price),
        discount_pct: undefined,
        special_terms: "",
      });
    }
  }, [open, units, reset]);

  const createOffer = useMutation({
    mutationFn: async (body: OfferForm) => {
      await api.post(`/negotiations/${id}/offers`, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["negotiation-offers", id] });
      qc.invalidateQueries({ queryKey: ["agent-leads"] });
      toast.success("تم إنشاء العرض");
    },
    onError: () => toast.error("فشل حفظ العرض"),
  });

  const updateOffer = useMutation({
    mutationFn: async ({ offerId, status }: { offerId: string; status: "accepted" | "rejected" }) => {
      await api.patch(`/negotiations/offers/${offerId}`, { status });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["negotiation-offers", id] });
      qc.invalidateQueries({ queryKey: ["agent-leads"] });
      toast.success("تم تحديث العرض");
    },
    onError: () => toast.error("فشل التحديث"),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>عروض التفاوض</SheetTitle>
          <SheetDescription>
            إنشاء عرض سعر مرتبط بوحدة. قبول العرض يضع العميل في مرحلة «مقبول» للمتابعة إلى الحجز.
          </SheetDescription>
        </SheetHeader>

        <form
          className="mt-6 space-y-4"
          onSubmit={form.handleSubmit((d) => !readOnly && createOffer.mutate(d))}
        >
          <div className="space-y-1">
            <Label>الوحدة</Label>
            {units.length === 0 ? (
              <p className="text-xs text-muted-foreground">لا توجد وحدات متاحة حالياً.</p>
            ) : (
              <Select
                value={form.watch("unit_id")}
                onValueChange={(v) => form.setValue("unit_id", v, { shouldValidate: true })}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الوحدة" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.unit_number} · {Number(u.price).toLocaleString("ar-EG")} ج.م
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {form.formState.errors.unit_id ? (
              <p className="text-xs text-destructive">{form.formState.errors.unit_id.message}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>السعر المعروض (ج.م)</Label>
              <Input type="number" step="0.01" {...form.register("offered_price")} disabled={readOnly} />
            </div>
            <div className="space-y-1">
              <Label>خصم %</Label>
              <Input type="number" step="0.1" {...form.register("discount_pct")} disabled={readOnly} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>شروط خاصة</Label>
            <Textarea rows={2} {...form.register("special_terms")} disabled={readOnly} />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={readOnly || createOffer.isPending || units.length === 0}
          >
            {createOffer.isPending ? "جاري الحفظ..." : "إضافة عرض"}
          </Button>
        </form>

        <div className="mt-8 space-y-3">
          <h3 className="text-sm font-semibold">سجل العروض</h3>
          {offers.length === 0 ? (
            <p className="text-xs text-muted-foreground">لا توجد عروض بعد.</p>
          ) : (
            <ul className="space-y-3">
              {offers.map((o) => (
                <li key={o.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">
                      {o.units?.unit_number ?? o.unit_id.slice(0, 8)} —{" "}
                      {Number(o.offered_price).toLocaleString("ar-EG")} ج.م
                    </span>
                    <span className="text-xs text-muted-foreground">{o.status}</span>
                  </div>
                  {o.discount_pct != null ? (
                    <p className="text-xs text-muted-foreground">خصم: {o.discount_pct}%</p>
                  ) : null}
                  {o.special_terms ? (
                    <p className="text-xs mt-1 border-t pt-1">{o.special_terms}</p>
                  ) : null}
                  {o.status === "pending" ? (
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        disabled={readOnly || updateOffer.isPending}
                        onClick={() => updateOffer.mutate({ offerId: o.id, status: "accepted" })}
                      >
                        قبول
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={readOnly || updateOffer.isPending}
                        onClick={() => updateOffer.mutate({ offerId: o.id, status: "rejected" })}
                      >
                        رفض
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
