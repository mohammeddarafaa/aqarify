import { Menu, Bell, LogOut, Search, Sun, Moon } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useTenantStore } from "@/stores/tenant.store";
import { useUIStore } from "@/stores/ui.store";
import { supabase } from "@/lib/supabase";
import { useNavigate, useLocation } from "react-router-dom";
import { appendTenantSearch } from "@/lib/tenant-path";
import { useNotificationBell } from "@/features/notifications/hooks/use-notification-bell";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTenantUi } from "@/hooks/use-tenant-ui";

interface Props { onMenuClick: () => void }

function initials(name?: string | null) {
  if (!name) return "U";
  return name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

export function Topbar({ onMenuClick }: Props) {
  const { t } = useTranslation("common");
  const clearSession = useAuthStore((s) => s.clearSession);
  const user = useAuthStore((s) => s.user);
  const tenant = useTenantStore((s) => s.tenant);
  const { darkMode, toggleDarkMode, language, setLanguage } = useUIStore();
  const { appName } = useTenantUi();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { count } = useNotificationBell();

  const tenantAware = (path: string) => appendTenantSearch(pathname, search, path);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearSession();
    navigate(tenantAware("/login"));
  };

  const searchPlaceholder = tenant?.name
    ? t("topbar.search_in", { name: tenant.name })
    : t("topbar.search");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/85 px-4 backdrop-blur lg:px-6">
      {/* Mobile menu trigger */}
      <button
        onClick={onMenuClick}
        aria-label={t("topbar.open_menu")}
        className="text-muted-foreground transition-colors hover:text-foreground lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Desktop search bar */}
      <div className="hidden min-w-0 flex-1 items-center gap-3 lg:flex">
        <div className="flex h-10 w-full max-w-sm items-center gap-2 rounded-full border border-border bg-card/75 px-4 shadow-sm">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="search"
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="ms-auto flex items-center gap-1">
        {/* Language toggle */}
        <button
          onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
          className="hidden h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:flex"
          aria-label={t("topbar.toggle_language")}
        >
          {language === "ar" ? "EN" : "ع"}
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label={darkMode ? t("topbar.light_mode") : t("topbar.dark_mode")}
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notification bell */}
        <button
          onClick={() => navigate(tenantAware("/notifications"))}
          aria-label={t("topbar.notifications")}
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span
              className={cn(
                "absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1",
                "text-[9px] font-bold text-background",
              )}
            >
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-border" />

        {/* User avatar → profile */}
        <button
          type="button"
          onClick={() => navigate(tenantAware("/profile"))}
          title={user?.full_name ?? t("nav.profile")}
          className="flex items-center gap-2 rounded-full pe-1 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar className="h-8 w-8 border-2 border-background">
            <AvatarImage src={user?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials(user?.full_name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium lg:block">
            {user?.full_name?.split(" ")[0] ?? t("nav.profile")}
          </span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={t("topbar.logout")}
          className="flex items-center gap-1 rounded-full px-2 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden text-[11px] font-medium tracking-widest uppercase lg:block">
            {t("topbar.logout")}
          </span>
        </button>
      </div>
    </header>
  );
}
