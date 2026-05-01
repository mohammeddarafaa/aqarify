import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { toast } from "@/lib/app-toast";
import { Plus, Phone, User2, ChevronDown, FileText } from "lucide-react";
import { appendTenantSearch } from "@/lib/tenant-path";
import { OfferDrawer } from "../components/offer-drawer";
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from "@/components/ui-kit";
import { useIsReadOnly } from "@/hooks/use-is-read-only";
import { SaaSPageShell } from "@/components/shared/saas-page-shell";
import { SaaSListToolbar } from "@/components/shared/saas-list-toolbar";
import { SaaSTableShell } from "@/components/shared/saas-table-shell";
import {
  LEAD_STAGES,
  getLeadStage,
  getLeadStageLabel,
} from "@/features/leads/shared/lead-stage";

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
  const [stageFilter, setStageFilter] = useState("all");
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

  const filteredLeads = useMemo(() => {
    const items = data?.items ?? [];
    const bySearch = search.trim()
      ? items.filter(
          (l) =>
            leadName(l).toLowerCase().includes(search.toLowerCase()) ||
            l.phone.includes(search),
        )
      : items;
    if (stageFilter === "all") return bySearch;
    return bySearch.filter((l) => getLeadStage(l) === stageFilter);
  }, [data, search, stageFilter]);

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
      <SaaSPageShell
        title="العملاء المحتملون"
        description="نمط جدول موحد لمتابعة العملاء والتحويل بسرعة أعلى."
      >
        <div className="flex items-center gap-2">
          <SaaSListToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="بحث بالاسم أو الهاتف..."
            filterLabel="المرحلة"
            filterValue={stageFilter}
            onFilterChange={setStageFilter}
            filterOptions={[{ value: "all", label: "كل المراحل" }, ...LEAD_STAGES.map((s) => ({ value: s.value, label: s.label }))]}
          />
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

        <SaaSTableShell
          isLoading={isLoading}
          isEmpty={filteredLeads.length === 0}
          empty={<div className="text-center text-muted-foreground">لا يوجد عملاء مطابقون.</div>}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">العميل</TableHead>
                <TableHead className="text-start">الهاتف</TableHead>
                <TableHead className="text-start">المرحلة</TableHead>
                <TableHead className="text-start">المصدر</TableHead>
                <TableHead className="text-start">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px]">{initials(leadName(lead))}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{leadName(lead)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary" dir="ltr">
                      <Phone className="h-3 w-3" /> {lead.phone}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getLeadStageLabel(getLeadStage(lead))}</Badge>
                  </TableCell>
                  <TableCell>{lead.source || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getLeadStage(lead) === "accepted" ? <ProceedToCheckoutButton leadId={lead.id} /> : null}
                      <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" disabled={readOnly} onClick={() => setOfferLeadId(lead.id)}>
                        <FileText className="h-3 w-3" /> عروض
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" disabled={readOnly}>
                            نقل <ChevronDown className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>نقل إلى مرحلة</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {LEAD_STAGES.filter((x) => x.value !== getLeadStage(lead)).map((x) => (
                            <DropdownMenuItem key={x.value} onClick={() => updateStage.mutate({ id: lead.id, newStage: x.value })}>
                              <span className={`h-2 w-2 rounded-full ${x.dot}`} />
                              {x.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SaaSTableShell>

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
      </SaaSPageShell>
    </>
  );
}
