import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { toast } from "@/lib/app-toast";
import {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Pin,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useIsReadOnly } from "@/hooks/use-is-read-only";
import { DataTableShell } from "@/components/shared/data-table-shell";

type FollowUp = {
  id: string;
  type: string;
  scheduled_at: string;
  notes?: string;
  status: string;
  potential_customer_id: string;
  potential_customers?: { name: string; full_name?: string; phone: string };
};

type Lead = { id: string; name?: string; full_name?: string; phone: string };

function leadDisplayName(p?: { name?: string; full_name?: string } | null) {
  return p?.name ?? p?.full_name ?? "—";
}

const TYPE_META: Record<
  string,
  { label: string; icon: React.ElementType; tint: string }
> = {
  call: { label: "اتصال", icon: Phone, tint: "bg-primary/10 text-primary" },
  whatsapp: {
    label: "واتساب",
    icon: MessageCircle,
    tint: "bg-[var(--status-success)]/10 text-[var(--status-success)]",
  },
  email: { label: "بريد", icon: Mail, tint: "bg-accent/20 text-accent-foreground" },
  visit: { label: "زيارة", icon: MapPin, tint: "bg-[var(--status-warning)]/10 text-[var(--status-warning)]" },
  other: { label: "أخرى", icon: Pin, tint: "bg-muted text-muted-foreground" },
};

const schema = z.object({
  potential_customer_id: z.string().uuid("اختر عميلاً"),
  type: z.enum(["call", "whatsapp", "email", "visit", "other"]),
  scheduled_at: z.string().min(1, "اختر موعداً"),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function AgentFollowUpsPage() {
  const qc = useQueryClient();
  const readOnly = useIsReadOnly();
  const [openNew, setOpenNew] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data = [], isLoading } = useQuery<FollowUp[]>({
    queryKey: ["agent-follow-ups"],
    queryFn: async () => {
      const r = await api.get("/agent/follow-ups");
      return r.data.data;
    },
  });

  const { data: leadsData } = useQuery({
    queryKey: ["agent-leads-list"],
    queryFn: async () => {
      const r = await api.get("/agent/potential-customers");
      return r.data.data as { items: Lead[] };
    },
    enabled: openNew,
  });

  const complete = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/agent/follow-ups/${id}/complete`, {
        outcome: "completed",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agent-follow-ups"] });
      toast.success("تم التسجيل كمكتملة");
    },
  });

  const create = useMutation({
    mutationFn: async (d: FormData) => {
      await api.post("/agent/follow-ups", {
        ...d,
        scheduled_at: new Date(d.scheduled_at).toISOString(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agent-follow-ups"] });
      toast.success("تمت الإضافة");
      setOpenNew(false);
      reset();
    },
    onError: () => toast.error("فشل الحفظ"),
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "call" },
  });
  void control;

  const pending = data.filter(
    (f) => f.status === "scheduled" && new Date(f.scheduled_at) >= new Date(),
  );
  const overdue = data.filter(
    (f) => f.status === "scheduled" && new Date(f.scheduled_at) < new Date(),
  );
  const done = data.filter((f) => f.status === "completed");
  const tableRows = data.filter((f) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "upcoming") return f.status === "scheduled" && new Date(f.scheduled_at) >= new Date();
    if (statusFilter === "overdue") return f.status === "scheduled" && new Date(f.scheduled_at) < new Date();
    if (statusFilter === "completed") return f.status === "completed";
    return true;
  });

  return (
    <>
      <Helmet>
        <title>المتابعات</title>
      </Helmet>
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">جدول المتابعات</h1>
          <p className="text-sm text-muted-foreground">نمط جدولي موحد للمتابعات مع فلترة حسب الحالة الزمنية.</p>
        </div>
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              جدول المتابعات
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              تتبع المكالمات والزيارات المجدولة مع العملاء المحتملين
            </p>
          </div>
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={readOnly}>
                <Plus className="h-4 w-4" /> جدولة متابعة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>متابعة جديدة</DialogTitle>
                <DialogDescription>
                  اختر العميل ونوع التواصل والموعد.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={handleSubmit((d) => create.mutate(d))}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label>العميل</Label>
                  <Select
                    value={watch("potential_customer_id")}
                    onValueChange={(v: string) =>
                      setValue("potential_customer_id", v, {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر عميلاً" />
                    </SelectTrigger>
                    <SelectContent>
                      {(leadsData?.items ?? []).map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {leadDisplayName(l)} — {l.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.potential_customer_id && (
                    <p className="text-xs text-destructive">
                      {errors.potential_customer_id.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>النوع</Label>
                    <Select
                      value={watch("type")}
                      onValueChange={(v: string) =>
                        setValue("type", v as FormData["type"], {
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TYPE_META).map(([k, m]) => (
                          <SelectItem key={k} value={k}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>الموعد</Label>
                    <Input
                      type="datetime-local"
                      {...register("scheduled_at")}
                    />
                    {errors.scheduled_at && (
                      <p className="text-xs text-destructive">
                        {errors.scheduled_at.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>ملاحظات</Label>
                  <Textarea
                    {...register("notes")}
                    rows={3}
                    placeholder="موضوع المكالمة، نقاط مهمة..."
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenNew(false)}
                  >
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={create.isPending}>
                    {create.isPending ? "جاري الحفظ..." : "حفظ"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <DataTableShell
          columns={[
            {
              header: "العميل",
              cell: ({ row }) => leadDisplayName(row.original.potential_customers),
            },
            {
              header: "النوع",
              cell: ({ row }) => (TYPE_META[row.original.type] ?? TYPE_META.other).label,
            },
            {
              header: "الموعد",
              cell: ({ row }) =>
                new Date(row.original.scheduled_at).toLocaleString("ar-EG"),
            },
            {
              header: "الحالة",
              cell: ({ row }) => {
                const f = row.original;
                const overdueFlag =
                  f.status === "scheduled" &&
                  new Date(f.scheduled_at) < new Date();
                return (
                  <Badge
                    variant={
                      f.status === "completed"
                        ? "default"
                        : overdueFlag
                          ? "destructive"
                          : "outline"
                    }
                  >
                    {f.status === "completed"
                      ? "مكتملة"
                      : overdueFlag
                        ? "متأخرة"
                        : "قادمة"}
                  </Badge>
                );
              },
            },
            {
              id: "actions",
              header: "إجراء",
              cell: ({ row }) =>
                row.original.status === "scheduled" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={readOnly || complete.isPending}
                    onClick={() => complete.mutate(row.original.id)}
                  >
                    تسجيل كمكتملة
                  </Button>
                ) : (
                  "—"
                ),
            },
          ] satisfies ColumnDef<FollowUp>[]}
          data={isLoading ? [] : tableRows}
          searchPlaceholder="ابحث باسم العميل أو رقم الهاتف..."
          searchValue=""
          filters={[
            {
              key: "status",
              label: "الحالة",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "all", label: `الكل (${data.length})` },
                { value: "upcoming", label: `قادمة (${pending.length})` },
                { value: "overdue", label: `متأخرة (${overdue.length})` },
                { value: "completed", label: `مكتملة (${done.length})` },
              ],
            },
          ]}
        />
      </div>
    </>
  );
}
