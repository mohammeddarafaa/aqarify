import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
};

type Metrics = {
  tenants: number;
  users: number;
  reservations: number;
  collected_at: string;
};

export default function PlatformAdminDashboardPage() {
  const { data: metrics } = useQuery({
    queryKey: ["platform-admin-metrics"],
    queryFn: async () => {
      const res = await api.get("/platform-admin/metrics");
      return res.data.data as Metrics;
    },
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["platform-admin-tenants"],
    queryFn: async () => {
      const res = await api.get("/platform-admin/tenants");
      return res.data.data as TenantRow[];
    },
  });

  return (
    <>
      <Helmet><title>Platform Control Plane</title></Helmet>
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Platform Control Plane</h1>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Tenants</p>
            <p className="text-2xl font-semibold">{metrics?.tenants ?? 0}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Users</p>
            <p className="text-2xl font-semibold">{metrics?.users ?? 0}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Reservations</p>
            <p className="text-2xl font-semibold">{metrics?.reservations ?? 0}</p>
          </div>
        </div>

        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">Tenant</th>
                <th className="px-4 py-3 text-left">Slug</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td className="px-4 py-3 font-medium">{tenant.name}</td>
                  <td className="px-4 py-3">{tenant.slug}</td>
                  <td className="px-4 py-3">
                    <Badge variant={tenant.status === "active" ? "default" : "outline"}>
                      {tenant.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {tenant.contact_email ?? tenant.contact_phone ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(tenant.created_at).toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No tenants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
