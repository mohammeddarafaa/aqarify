import { Menu, Bell, LogOut, Search } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useTenantStore } from "@/stores/tenant.store";
import { supabase } from "@/lib/supabase";
import { useNavigate, useLocation } from "react-router-dom";
import { appendTenantSearch } from "@/lib/tenant-path";
import { useNotificationBell } from "@/features/notifications/hooks/use-notification-bell";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Props { onMenuClick: () => void }

function initials(name?: string | null) {
  if (!name) return "U";
  return name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

export function Topbar({ onMenuClick }: Props) {
  const clearSession = useAuthStore((s) => s.clearSession);
  const user = useAuthStore((s) => s.user);
  const tenant = useTenantStore((s) => s.tenant);
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  const { count } = useNotificationBell();

  const tenantAware = (path: string) => appendTenantSearch(pathname, search, path);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearSession();
    navigate(tenantAware("/login"));
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/85 px-4 backdrop-blur lg:px-6">
      <button onClick={onMenuClick} className="text-muted-foreground transition-colors hover:text-foreground lg:hidden">
        <Menu className="h-4 w-4" />
      </button>

      <div className="hidden min-w-0 flex-1 items-center gap-3 lg:flex">
        <div className="flex h-11 w-full max-w-md items-center gap-2 rounded-full border border-transparent bg-card/75 px-4 shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder={tenant?.name ? `Search in ${tenant.name}` : "Search"}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="ms-auto flex items-center gap-2">
        <button
          onClick={() => navigate(tenantAware("/notifications"))}
          className="relative rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className={cn(
              "absolute -end-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[9px] text-background",
              "flex items-center justify-center font-bold"
            )}>
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => navigate(tenantAware("/profile"))}
          title="الملف الشخصي"
          className="flex items-center rounded-full ps-1 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar className="h-8 w-8 border-2 border-background">
            <AvatarImage src={user?.avatar_url ?? undefined} />
            <AvatarFallback>{initials(user?.full_name)}</AvatarFallback>
          </Avatar>
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-medium tracking-widest uppercase text-muted-foreground transition-colors hover:text-foreground">
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </button>
      </div>
    </header>
  );
}
