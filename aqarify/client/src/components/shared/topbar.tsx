import { Menu, Bell, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useTenantStore } from "@/stores/tenant.store";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { isStaffRole, roleLabel } from "@/lib/rbac";

interface Props { onMenuClick: () => void }

export function Topbar({ onMenuClick }: Props) {
  const clearSession = useAuthStore((s) => s.clearSession);
  const user = useAuthStore((s) => s.user);
  const tenant = useTenantStore((s) => s.tenant);
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ["unread-notifications"],
    queryFn: async () => { const r = await api.get("/notifications/unread-count"); return r.data.data; },
    refetchInterval: 60_000,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearSession();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-white px-5">
      {/* Mobile menu toggle */}
      <button onClick={onMenuClick} className="lg:hidden text-[#888888] hover:text-[#141414] transition-colors">
        <Menu className="h-4 w-4" />
      </button>

      {/* Page context */}
      <div className="hidden min-w-0 flex-1 lg:flex lg:items-center lg:gap-3 pe-4">
        <div className="min-w-0">
          <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#888888] truncate">
            {tenant?.name ? `${tenant.name}` : "البوابة"}
          </p>
          <p className="text-[11px] font-medium text-[#141414] truncate mt-0.5">
            {user?.full_name ?? "لوحة التحكم"}
          </p>
        </div>
        {user?.role ? (
          <span
            className={cn(
              "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-widest uppercase",
              isStaffRole(user.role)
                ? "border-[#141414] bg-[#141414] text-white"
                : "border-[var(--color-border)] text-[#666]"
            )}
            title={isStaffRole(user.role) ? "بوابة الفريق" : "بوابة العملاء"}
          >
            {roleLabel(user.role)}
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-4 ms-auto">
        {/* Bell */}
        <button
          onClick={() => navigate("/notifications")}
          className="relative text-[#888888] hover:text-[#141414] transition-colors">
          <Bell className="h-4 w-4" />
          {(data?.count ?? 0) > 0 && (
            <span className={cn(
              "absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-[#141414] text-[8px] text-white",
              "flex items-center justify-center font-bold"
            )}>
              {data.count > 9 ? "9+" : data.count}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="h-4 w-px bg-[var(--color-border)]" />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-[10px] font-medium tracking-widest uppercase text-[#888888] hover:text-[#141414] transition-colors">
          <LogOut className="h-3.5 w-3.5" />
          خروج
        </button>
      </div>
    </header>
  );
}
