import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/app-toast";

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  last_activity_at: string | null;
};

type Metrics = {
  tenants: number;
  users: number;
  reservations: number;
  collected_at: string;
};

function statusVariant(status: string): "default" | "outline" | "destructive" | "secondary" {
  if (status === "active") return "default";
  if (status === "trial") return "secondary";
  if (status === "suspended") return "destructive";
  return "outline";
}

export default function PlatformAdminDashboardPage() {
  const qc = useQueryClient();

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["platform-admin-metrics"],
    queryFn: async () => (await api.get("/platform-admin/metrics")).data.data as Metrics,
  });

  const { data: tenants = [], isLoading: tenantsLoading } = useQuery({
    queryKey: ["platform-admin-tenants"],
    queryFn: async () => (await api.get("/platform-admin/tenants")).data.data as TenantRow[],
  });

  const { mutate: changeStatus, isPending: statusPending } = useMutation({
    mutationFn: async ({ tenantId, status }: { tenantId: string; status: string }) =>
      api.patch(`/platform-admin/tenants/${tenantId}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform-admin-tenants"] });
      qc.invalidateQueries({ queryKey: ["platform-admin-metrics"] });
      toast.success("تم تحديث حالة المستأجر");
    },
    onError: () => toast.error("فشل تحديث الحالة"),
  });

  const isLoading = metricsLoading || tenantsLoading;

  return (
    <>
      <Helmet><title>Platform Control Plane</title></Helmet>
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Platform Control Plane</h1>

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {isLoading ? (
            <>
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </>
          ) : (
            <>
              {[
                { label: "Tenants", value: metrics?.tenants ?? 0 },
                { label: "Users", value: metrics?.users ?? 0 },
                { label: "Reservations", value: metrics?.reservations ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-semibold">{value.toLocaleString()}</p>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Tenant table */}
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">Tenant</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Last Activity</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tenantsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12">
                    <EmptyState title="No tenants yet" />
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-xs text-muted-foreground">{tenant.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(tenant.status)}>
                        {tenant.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {tenant.contact_email ?? tenant.contact_phone ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {tenant.last_activity_at
                        ? new Date(tenant.last_activity_at).toLocaleDateString("en-GB")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(tenant.created_at).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-3">
                      {tenant.status === "suspended" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={statusPending}
                          onClick={() => changeStatus({ tenantId: tenant.id, status: "active" })}
                        >
                          Activate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          disabled={statusPending}
                          onClick={() => changeStatus({ tenantId: tenant.id, status: "suspended" })}
                        >
                          Suspend
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
