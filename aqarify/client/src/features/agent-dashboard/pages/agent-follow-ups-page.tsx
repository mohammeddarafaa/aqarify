import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/app-toast";
import {
  CheckCircle2,
  Calendar,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Pin,
  Plus,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useIsReadOnly } from "@/hooks/use-is-read-only";

type FollowUp = {
  id: string;
  type: string;
  scheduled_at: string;
  notes?: string;
  status: string;
  potential_customer_id: string;
  potential_customers?: { full_name: string; phone: string };
};

type Lead = { id: string; full_name: string; phone: string };

const TYPE_META: Record<
  string,
  { label: string; icon: React.ElementType; tint: string }
> = {
  call: { label: "اتصال", icon: Phone, tint: "bg-blue-50 text-blue-600" },
  whatsapp: {
    label: "واتساب",
    icon: MessageCircle,
    tint: "bg-green-50 text-green-600",
  },
  email: { label: "بريد", icon: Mail, tint: "bg-purple-50 text-purple-600" },
  visit: { label: "زيارة", icon: MapPin, tint: "bg-orange-50 text-orange-600" },
  other: { label: "أخرى", icon: Pin, tint: "bg-slate-50 text-slate-600" },
};

const schema = z.object({
  potential_customer_id: z.string().uuid("اختر عميلاً"),
  type: z.enum(["call", "whatsapp", "email", "visit", "other"]),
  scheduled_at: z.string().min(1, "اختر موعداً"),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function initials(name?: string | null) {
  if (!name) return "؟";
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function FollowUpCard({
  f,
  onComplete,
  readOnly,
  isCompleting,
}: {
  f: FollowUp;
  onComplete: (id: string) => void;
  readOnly: boolean;
  isCompleting?: boolean;
}) {
  const meta = TYPE_META[f.type] ?? TYPE_META.other;
  const Icon = meta.icon;
  const when = new Date(f.scheduled_at);
  const overdue = f.status === "scheduled" && when < new Date();
  const days = Math.ceil(
    (when.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 space-y-3 transition-all",
        f.status === "completed" && "opacity-60",
        overdue && "border-destructive/40 bg-destructive/5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar size="sm">
            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
              {initials(f.potential_customers?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium truncate">
              {f.potential_customers?.full_name ?? "—"}
            </p>
            <a
              href={`tel:${f.potential_customers?.phone ?? ""}`}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
              dir="ltr"
            >
              {f.potential_customers?.phone}
            </a>
          </div>
        </div>
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            meta.tint,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{when.toLocaleString("ar-EG")}</span>
        </div>
        {f.status === "scheduled" && (
          <Badge variant={overdue ? "destructive" : "outline"}>
            {overdue
              ? "متأخرة"
              : days === 0
                ? "اليوم"
                : days === 1
                  ? "غداً"
                  : `خلال ${days} يوم`}
          </Badge>
        )}
        {f.status === "completed" && (
          <Badge variant="default" className="bg-green-600">
            مكتملة
          </Badge>
        )}
      </div>

      {f.notes && (
        <p className="text-xs text-muted-foreground border-t pt-2">{f.notes}</p>
      )}

      {f.status === "scheduled" && (
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-1.5"
          disabled={readOnly || isCompleting}
          onClick={() => onComplete(f.id)}
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> تسجيل كمكتملة
        </Button>
      )}
    </div>
  );
}

export default function AgentFollowUpsPage() {
  const qc = useQueryClient();
  const readOnly = useIsReadOnly();
  const [openNew, setOpenNew] = useState(false);

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

  return (
    <>
      <Helmet>
        <title>المتابعات</title>
      </Helmet>
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
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
                          {l.full_name} — {l.phone}
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

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <Tabs defaultValue="upcoming">
            <TabsList>
              <TabsTrigger value="upcoming">
                قادمة <Badge variant="outline">{pending.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="overdue">
                متأخرة{" "}
                <Badge variant={overdue.length ? "destructive" : "outline"}>
                  {overdue.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="completed">
                مكتملة <Badge variant="outline">{done.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="pt-4">
              {pending.length === 0 ? (
                <EmptyBlock label="لا توجد متابعات قادمة" />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {pending.map((f) => (
                    <FollowUpCard
                      key={f.id}
                      f={f}
                      onComplete={(id) => complete.mutate(id)}
                      readOnly={readOnly}
                      isCompleting={complete.isPending}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="overdue" className="pt-4">
              {overdue.length === 0 ? (
                <EmptyBlock label="لا توجد متابعات متأخرة — أحسنت!" />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {overdue.map((f) => (
                    <FollowUpCard
                      key={f.id}
                      f={f}
                      onComplete={(id) => complete.mutate(id)}
                      readOnly={readOnly}
                      isCompleting={complete.isPending}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="pt-4">
              {done.length === 0 ? (
                <EmptyBlock label="لا توجد متابعات مكتملة بعد" />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {done.slice(0, 30).map((f) => (
                    <FollowUpCard
                      key={f.id}
                      f={f}
                      onComplete={(id) => complete.mutate(id)}
                      readOnly={readOnly}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
}

function EmptyBlock({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center rounded-xl border bg-card">
      <ClipboardCheck className="h-10 w-10 text-muted-foreground/40" />
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
}
