import { useMemo, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Search } from "lucide-react";
import { api } from "@/lib/api";
import { appendTenantSearch } from "@/lib/tenant-path";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  getLeadStageLabel,
} from "@/features/leads/shared/lead-stage";

type Lead = {
  id: string;
  name: string;
  full_name?: string;
  phone: string;
  negotiation_status?: string;
  stage?: string;
  created_at?: string;
};

function leadName(lead: Lead) {
  return lead.name ?? lead.full_name ?? "—";
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

export default function AgentCustomersPage() {
  const [search, setSearch] = useState("");
  const { pathname, search: locSearch } = useLocation();
  const withTenant = (p: string) => appendTenantSearch(pathname, locSearch, p);

  const { data, isLoading } = useQuery({
    queryKey: ["agent-potential-customers-crm"],
    queryFn: async () => {
      const r = await api.get("/agent/potential-customers");
      return r.data.data as { items: Lead[] };
    },
  });

  const filtered = useMemo(() => {
    const items = data?.items ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((l) => {
      const n = leadName(l).toLowerCase();
      const ph = (l.phone ?? "").toLowerCase();
      return n.includes(q) || ph.includes(q);
    });
  }, [data?.items, search]);

  return (
    <>
      <Helmet>
        <title>ملف العملاء</title>
      </Helmet>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ملف العملاء</h1>
          <p className="text-sm text-muted-foreground">قائمة العملاء المحتملين مع الملف التفصيلي والنشاط.</p>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الهاتف..."
            className="ps-9"
          />
        </div>

        {isLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {filtered.map((lead) => (
              <li key={lead.id}>
                <Link
                  to={withTenant(`/agent/customers/${lead.id}`)}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/40"
                >
                  <Avatar className="size-11 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold">
                      {initials(leadName(lead))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{leadName(lead)}</p>
                    <p className="truncate text-sm text-muted-foreground" dir="ltr">
                      {lead.phone}
                    </p>
                  </div>
                  <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
                    {getLeadStageLabel(lead.negotiation_status ?? lead.stage)}
                  </Badge>
                  <Button type="button" size="sm" variant="ghost" className="shrink-0 gap-1 pe-1">
                    <span className="sr-only">فتح الملف</span>
                    <ChevronLeft className="size-4" />
                  </Button>
                </Link>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="p-12 text-center text-sm text-muted-foreground">لا توجد نتائج.</li>
            )}
          </ul>
        )}
      </div>
    </>
  );
}
