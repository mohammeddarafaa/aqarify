import { AlertTriangleIcon } from "lucide-react";
import { useTenantStore } from "@/stores/tenant.store";

// Shown at the top of every tenant page when the tenant's Aqarify
// subscription has lapsed. The server still serves GET data, but writes
// are blocked by the subscriptionGuard middleware (HTTP 402).
export function ReadOnlyBanner() {
  const tenant = useTenantStore((s) => s.tenant);
  if (!tenant || tenant.status !== "read_only") return null;

  return (
    <div className="w-full border-b border-amber-300/60 bg-amber-50 text-amber-900">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-xs">
        <AlertTriangleIcon className="size-4 shrink-0" />
        <span>
          This portal is in <strong>read-only mode</strong> — the subscription for{" "}
          <strong>{tenant.name}</strong> has lapsed. New reservations and updates are paused
          until billing is restored.
        </span>
      </div>
    </div>
  );
}
