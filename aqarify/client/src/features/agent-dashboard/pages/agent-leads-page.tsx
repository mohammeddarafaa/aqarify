import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/app-toast";
import { Plus, Phone, User2, ChevronDown, Search, FileText } from "lucide-react";
import { appendTenantSearch } from "@/lib/tenant-path";
import { OfferDrawer } from "../components/offer-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsReadOnly } from "@/hooks/use-is-read-only";

type Lead = {
  id: string;
  name: string;
  /** @deprecated API now returns `name` */
  full_name?: string;
  phone: string;
  source?: string;
  negotiation_status?: string;
  /** @deprecated use negotiation_status */
  stage?: string;
  notes?: string;
  created_at?: string;
};

function leadName(lead: Lead) {
  return lead.name ?? lead.full_name ?? "—";
}

function leadStatus(lead: Lead) {
  return lead.negotiation_status ?? lead.stage ?? "new";
}

const STAGES: {
  value: string;
  label: string;
  color: string;
  dot: string;
}[] = [
  { value: "new", label: "جديد", color: "bg-blue-50 border-blue-200", dot: "bg-blue-500" },
  { value: "contacted", label: "تم التواصل", color: "bg-purple-50 border-purple-200", dot: "bg-purple-500" },
  { value: "negotiating", label: "تفاوض", color: "bg-pink-50 border-pink-200", dot: "bg-pink-500" },
  { value: "offer_made", label: "عرض مقدّم", color: "bg-orange-50 border-orange-200", dot: "bg-orange-500" },
  { value: "accepted", label: "مقبول", color: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  { value: "rejected", label: "مرفوض", color: "bg-rose-50 border-rose-200", dot: "bg-rose-500" },
  { value: "lost", label: "خسارة", color: "bg-red-50 border-red-200", dot: "bg-red-500" },
];

const schema = z.object({
  full_name: z.string().min(2, "الاسم مطلوب"),
  phone: z.string().min(10, "رقم هاتف غير صالح"),
  email: z.string().email().optional().or(z.literal("")),
  source: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function ProceedToCheckoutButton({ leadId }: { leadId: string }) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { data: offers } = useQuery({
    queryKey: ["negotiation-offers", leadId],
    queryFn: async () =>
      (await api.get(`/negotiations/${leadId}/offers`)).data.data as {
        status: string;
        unit_id: string;
      }[],
  });
  const accepted = offers?.find((o) => o.status === "accepted");
  if (!accepted) return null;
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      className="h-7 w-full text-[10px]"
      onClick={() =>
        navigate(appendTenantSearch(pathname, search, `/checkout/${accepted.unit_id}`))
      }
    >
      متابعة الحجز
    </Button>
  );
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AgentLeadsPage() {
  const [search, setSearch] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [offerLeadId, setOfferLeadId] = useState<string | null>(null);
  const qc = useQueryClient();
  const readOnly = useIsReadOnly();

  const { data, isLoading } = useQuery({
    queryKey: ["agent-leads"],
    queryFn: async () => {
      const r = await api.get("/agent/potential-customers");
      return r.data.data as { items: Lead[] };
    },
  });

  const addLead = useMutation({
    mutationFn: async (d: FormData) => {
      await api.post("/agent/potential-customers", d);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agent-leads"] });
      toast.success("تم إضافة العميل");
      setOpenNew(false);
      reset();
    },
    onError: () => toast.error("فشل الإضافة"),
  });

  const updateStage = useMutation({
    mutationFn: async ({
      id,
      newStage,
    }: {
      id: string;
      newStage: string;
    }) => {
      await api.patch(`/agent/potential-customers/${id}/stage`, {
        stage: newStage,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agent-leads"] });
      toast.success("تم التحديث");
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const leadsByStage = useMemo(() => {
    const items = data?.items ?? [];
    const filtered = search.trim()
      ? items.filter(
          (l) =>
            leadName(l).toLowerCase().includes(search.toLowerCase()) ||
            l.phone.includes(search),
        )
      : items;
    return STAGES.reduce<Record<string, Lead[]>>((acc, s) => {
      acc[s.value] = filtered.filter((l) => leadStatus(l) === s.value);
      return acc;
    }, {});
  }, [data, search]);

  return (
    <>
      <Helmet>
        <title>العملاء المحتملون</title>
      </Helmet>
      <OfferDrawer
        leadId={offerLeadId}
        open={!!offerLeadId}
        onOpenChange={(v) => {
          if (!v) setOfferLeadId(null);
        }}
      />
      <div className="mx-auto max-w-[1400px] px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">العملاء المحتملون</h1>
            <p className="text-sm text-muted-foreground mt-1">
              لوحة مرحلية لإدارة مسار العملاء من أول اتصال حتى التحويل
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالاسم أو الهاتف..."
                className="w-56 ps-3 pe-8"
              />
            </div>
            <Dialog open={openNew} onOpenChange={setOpenNew}>
              <DialogTrigger asChild>
                <Button className="gap-2" disabled={readOnly}>
                  <Plus className="h-4 w-4" /> عميل جديد
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة عميل محتمل</DialogTitle>
                  <DialogDescription>
                    أدخل بيانات العميل لإضافته إلى المسار في مرحلة "جديد".
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={handleSubmit((d) => addLead.mutate(d))}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label>الاسم الكامل</Label>
                    <Input {...register("full_name")} placeholder="أحمد محمد" />
                    {errors.full_name && (
                      <p className="text-xs text-destructive">
                        {errors.full_name.message}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>الهاتف</Label>
                      <Input
                        {...register("phone")}
                        placeholder="01xxxxxxxxx"
                        dir="ltr"
                      />
                      {errors.phone && (
                        <p className="text-xs text-destructive">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>البريد (اختياري)</Label>
                      <Input {...register("email")} dir="ltr" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>المصدر</Label>
                    <Input
                      {...register("source")}
                      placeholder="إعلان / إحالة / واتساب..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>ملاحظات</Label>
                    <Textarea
                      {...register("notes")}
                      placeholder="اهتمامات العميل، الميزانية، الموقع المفضل..."
                      rows={3}
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
                    <Button type="submit" disabled={addLead.isPending}>
                      {addLead.isPending ? "جاري الحفظ..." : "حفظ"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Kanban */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto pb-4 -mx-4 px-4">
            <div className="flex gap-4 min-w-max">
              {STAGES.map((s) => {
                const leads = leadsByStage[s.value] ?? [];
                return (
                  <div
                    key={s.value}
                    className="w-72 shrink-0 flex flex-col rounded-xl border bg-muted/20 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-3 py-2.5 bg-card border-b">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn("h-2 w-2 rounded-full", s.dot)}
                        />
                        <h3 className="text-sm font-semibold">{s.label}</h3>
                        <Badge variant="outline" className="h-5 text-[10px]">
                          {leads.length}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex-1 p-2 space-y-2 min-h-[120px]">
                      {leads.length === 0 ? (
                        <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
                          لا توجد عناصر
                        </div>
                      ) : (
                        leads.map((lead) => (
                          <div
                            key={lead.id}
                            className={cn(
                              "rounded-lg bg-card border p-3 space-y-2 shadow-xs hover:shadow-sm transition-shadow",
                            )}
                          >
                            <div className="flex items-start gap-2">
                              <Avatar size="sm">
                                <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                  {initials(leadName(lead))}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {leadName(lead)}
                                </p>
                                <a
                                  href={`tel:${lead.phone}`}
                                  className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors"
                                  dir="ltr"
                                >
                                  <Phone className="h-3 w-3" /> {lead.phone}
                                </a>
                              </div>
                            </div>
                            {lead.source && (
                              <p className="text-[11px] text-muted-foreground">
                                المصدر: {lead.source}
                              </p>
                            )}
                            {lead.notes && (
                              <p className="text-xs text-muted-foreground border-t pt-2 line-clamp-2">
                                {lead.notes}
                              </p>
                            )}
                            {leadStatus(lead) === "accepted" ? (
                              <ProceedToCheckoutButton leadId={lead.id} />
                            ) : null}
                            <div className="flex flex-wrap gap-1 justify-end pt-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-6 gap-1 text-[10px]"
                                disabled={readOnly}
                                onClick={() => setOfferLeadId(lead.id)}
                              >
                                <FileText className="h-3 w-3" /> عروض
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 gap-1 text-[10px]"
                                    disabled={readOnly}
                                  >
                                    نقل <ChevronDown className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>
                                    نقل إلى مرحلة
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {STAGES.filter(
                                    (x) => x.value !== leadStatus(lead),
                                  ).map((x) => (
                                    <DropdownMenuItem
                                      key={x.value}
                                      onClick={() =>
                                        updateStage.mutate({
                                          id: lead.id,
                                          newStage: x.value,
                                        })
                                      }
                                    >
                                      <span
                                        className={cn(
                                          "h-2 w-2 rounded-full",
                                          x.dot,
                                        )}
                                      />
                                      {x.label}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty all */}
        {!isLoading && (data?.items?.length ?? 0) === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center rounded-xl border bg-card">
            <User2 className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">لا يوجد عملاء محتملون بعد</p>
            <Button onClick={() => setOpenNew(true)} disabled={readOnly}>
              أضف أول عميل
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
