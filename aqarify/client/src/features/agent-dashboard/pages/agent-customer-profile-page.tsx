import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "@/lib/app-toast";
import { appendTenantSearch } from "@/lib/tenant-path";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LEAD_STAGES, getLeadStageLabel } from "@/features/leads/shared/lead-stage";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type LeadBundle = {
  lead: Record<string, unknown> & {
    id: string;
    name?: string;
    full_name?: string;
    phone?: string;
    email?: string | null;
    notes?: string | null;
    negotiation_status?: string | null;
    source?: string | null;
    created_at?: string;
    assigned_agent?: { full_name?: string; email?: string; phone?: string } | null;
  };
  reservations: Array<Record<string, unknown>>;
  payments: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  follow_ups: Array<Record<string, unknown>>;
  negotiations: Array<Record<string, unknown>>;
  activity: Array<Record<string, unknown>>;
};

function leadDisplayName(lead: LeadBundle["lead"]) {
  return String(lead.name ?? lead.full_name ?? "—");
}

export default function AgentCustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { pathname, search } = useLocation();
  const qc = useQueryClient();
  const withTenant = (p: string) => appendTenantSearch(pathname, search, p);
  const validId = id && UUID_RE.test(id);

  const [notesDraft, setNotesDraft] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["potential-customer-bundle", id],
    queryFn: async () => {
      const r = await api.get(`/agent/potential-customers/${id}`);
      return r.data.data as LeadBundle;
    },
    enabled: !!validId,
  });

  useEffect(() => {
    if (!data?.lead) return;
    setNotesDraft(String(data.lead.notes ?? ""));
  }, [data?.lead?.id, data?.lead?.notes]);

  const patchLead = useMutation({
    mutationFn: async (body: { notes?: string; negotiation_status?: string }) => {
      await api.patch(`/agent/potential-customers/${id}`, body);
    },
    onSuccess: () => {
      toast.success("تم الحفظ");
      qc.invalidateQueries({ queryKey: ["potential-customer-bundle", id] });
      qc.invalidateQueries({ queryKey: ["agent-potential-customers-crm"] });
      qc.invalidateQueries({ queryKey: ["agent-leads"] });
    },
    onError: () => toast.error("تعذّر الحفظ"),
  });

  if (!validId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted-foreground">معرّف غير صالح.</p>
        <Button asChild variant="link" className="mt-4">
          <Link to={withTenant("/agent/customers")}>العودة للقائمة</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted-foreground">تعذّر تحميل الملف أو غير مصرّح.</p>
        <Button asChild variant="link" className="mt-4">
          <Link to={withTenant("/agent/customers")}>العودة للقائمة</Link>
        </Button>
      </div>
    );
  }

  const L = data.lead;

  return (
    <>
      <Helmet>
        <title>{leadDisplayName(L)} — ملف عميل</title>
      </Helmet>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Button variant="ghost" size="sm" className="mb-2 -ms-2 gap-1 text-muted-foreground" asChild>
              <Link to={withTenant("/agent/customers")}>
                <ArrowRight className="size-4 rotate-180" />
                القائمة
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">{leadDisplayName(L)}</h1>
            <p className="text-sm text-muted-foreground" dir="ltr">
              {L.phone ?? "—"}
              {L.email ? ` · ${L.email}` : ""}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Badge variant="secondary">{getLeadStageLabel(L.negotiation_status ?? undefined)}</Badge>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">حالة التفاوض</Label>
              <select
                className="flex h-9 min-w-[12rem] rounded-md border border-input bg-background px-2 text-sm"
                value={L.negotiation_status ?? "new"}
                onChange={(e) =>
                  patchLead.mutate({ negotiation_status: e.target.value })
                }
                disabled={patchLead.isPending}
              >
                {LEAD_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-muted/60 p-1">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="reservations">الحجوزات</TabsTrigger>
            <TabsTrigger value="payments">المدفوعات</TabsTrigger>
            <TabsTrigger value="documents">المستندات</TabsTrigger>
            <TabsTrigger value="followups">المتابعات</TabsTrigger>
            <TabsTrigger value="negotiations">التفاوض</TabsTrigger>
            <TabsTrigger value="activity">النشاط</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">المصدر</p>
                <p className="font-medium">{String(L.source ?? "—")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">تاريخ الإنشاء</p>
                <p className="font-medium">
                  {L.created_at ? new Date(L.created_at).toLocaleString("ar-EG") : "—"}
                </p>
              </div>
              {L.assigned_agent && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">الموظف المسؤول</p>
                  <p className="font-medium">{L.assigned_agent.full_name ?? L.assigned_agent.email ?? "—"}</p>
                </div>
              )}
            </div>
            <div className="space-y-2 rounded-xl border bg-card p-4">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                rows={5}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="ملاحظات داخلية..."
              />
              <Button
                type="button"
                size="sm"
                disabled={patchLead.isPending || notesDraft === String(L.notes ?? "")}
                onClick={() => patchLead.mutate({ notes: notesDraft })}
              >
                حفظ الملاحظات
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="reservations" className="mt-4">
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-start">الحالة</th>
                    <th className="px-3 py-2 text-start">الوحدة</th>
                    <th className="px-3 py-2 text-start">السعر</th>
                    <th className="px-3 py-2 text-start">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.reservations.map((r) => (
                    <tr key={String(r.id)}>
                      <td className="px-3 py-2">{String(r.status ?? "—")}</td>
                      <td className="px-3 py-2">
                        {(r.units as { unit_number?: string } | undefined)?.unit_number ?? "—"}
                      </td>
                      <td className="px-3 py-2">{r.total_price != null ? String(r.total_price) : "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {r.created_at ? new Date(String(r.created_at)).toLocaleDateString("ar-EG") : "—"}
                      </td>
                    </tr>
                  ))}
                  {data.reservations.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                        لا حجوزات مرتبطة بعد
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-start">النوع</th>
                    <th className="px-3 py-2 text-start">المبلغ</th>
                    <th className="px-3 py-2 text-start">الحالة</th>
                    <th className="px-3 py-2 text-start">الاستحقاق</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.payments.map((p) => (
                    <tr key={String(p.id)}>
                      <td className="px-3 py-2">{String(p.type ?? "—")}</td>
                      <td className="px-3 py-2">{p.amount != null ? String(p.amount) : "—"}</td>
                      <td className="px-3 py-2">{String(p.status ?? "—")}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {p.due_date ? new Date(String(p.due_date)).toLocaleDateString("ar-EG") : "—"}
                      </td>
                    </tr>
                  ))}
                  {data.payments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                        لا مدفوعات
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <ul className="divide-y rounded-xl border">
              {data.documents.map((d) => (
                <li key={String(d.id)} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <span className="font-medium">{String(d.type ?? "مستند")}</span>
                  <Badge variant="outline">{String(d.status ?? "—")}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {d.created_at ? new Date(String(d.created_at)).toLocaleString("ar-EG") : ""}
                  </span>
                </li>
              ))}
              {data.documents.length === 0 && (
                <li className="px-4 py-8 text-center text-muted-foreground">لا مستندات</li>
              )}
            </ul>
          </TabsContent>

          <TabsContent value="followups" className="mt-4">
            <ul className="divide-y rounded-xl border">
              {data.follow_ups.map((f) => (
                <li key={String(f.id)} className="space-y-1 px-4 py-3">
                  <p className="text-sm">{String(f.notes ?? f.title ?? "متابعة")}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.scheduled_at ? new Date(String(f.scheduled_at)).toLocaleString("ar-EG") : ""}
                  </p>
                </li>
              ))}
              {data.follow_ups.length === 0 && (
                <li className="px-4 py-8 text-center text-muted-foreground">لا متابعات مسجّلة</li>
              )}
            </ul>
          </TabsContent>

          <TabsContent value="negotiations" className="mt-4">
            <ul className="divide-y rounded-xl border">
              {data.negotiations.map((n) => (
                <li key={String(n.id)} className="space-y-1 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{String(n.status ?? "—")}</Badge>
                    <span className="text-sm">
                      {(n.units as { unit_number?: string } | undefined)?.unit_number ?? "وحدة"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {n.created_at ? new Date(String(n.created_at)).toLocaleString("ar-EG") : ""}
                  </p>
                </li>
              ))}
              {data.negotiations.length === 0 && (
                <li className="px-4 py-8 text-center text-muted-foreground">لا سجلات تفاوض</li>
              )}
            </ul>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <ul className="divide-y rounded-xl border">
              {data.activity.map((a) => (
                <li key={String(a.id)} className="space-y-1 px-4 py-3">
                  <p className="text-sm font-medium">
                    {String(a.action ?? "")} · {String(a.entity_type ?? "")}
                  </p>
                  {a.details != null && (
                    <pre className="max-h-24 overflow-auto rounded bg-muted/50 p-2 text-[10px] leading-relaxed">
                      {typeof a.details === "string" ? a.details : JSON.stringify(a.details, null, 2)}
                    </pre>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {a.created_at ? new Date(String(a.created_at)).toLocaleString("ar-EG") : ""}
                  </p>
                </li>
              ))}
              {data.activity.length === 0 && (
                <li className="px-4 py-8 text-center text-muted-foreground">لا سجل نشاط</li>
              )}
            </ul>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
