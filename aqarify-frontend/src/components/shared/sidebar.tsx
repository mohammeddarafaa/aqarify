import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTenantStore } from "@/stores/tenant.store";
import { useAuthStore } from "@/stores/auth.store";
import { useUIStore } from "@/stores/ui.store";
import { appendTenantSearch } from "@/lib/tenant-path";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTenantUi } from "@/hooks/use-tenant-ui";
import { useTranslation } from "react-i18next";
import {
  Home, Search, FileText, CreditCard, Users, BarChart3, Settings,
  Bell, Building2, ClipboardList, X, PhoneCall, BookUser, Sparkles,
  LayoutDashboard, Globe, ShieldCheck, ChevronRight,
} from "lucide-react";

// ─── Navigation definition ───────────────────────────────────────────────────
// No hardcoded Arabic here — all labels are i18n keys resolved at runtime.
// Adding a new role entry is one line.
// ─────────────────────────────────────────────────────────────────────────────
type NavItem = {
  to: string;
  labelKey: string;
  icon: React.ElementType;
  roles: string[];
  group?: string;
};

const NAV: NavItem[] = [
  // Customer
  { to: "/customer/dashboard", labelKey: "nav.overview",      icon: Home,           roles: ["customer"],                                  group: "customer" },
  { to: "/browse",             labelKey: "nav.browse",        icon: Search,         roles: ["customer"],                                  group: "customer" },
  { to: "/reservations",       labelKey: "nav.reservations",  icon: FileText,       roles: ["customer"],                                  group: "customer" },
  { to: "/payments",           labelKey: "nav.payments",      icon: CreditCard,     roles: ["customer"],                                  group: "customer" },
  { to: "/waitlist",           labelKey: "nav.waitlist",      icon: ClipboardList,  roles: ["customer"],                                  group: "customer" },
  { to: "/documents",          labelKey: "nav.documents",     icon: FileText,       roles: ["customer"],                                  group: "customer" },
  // Agent
  { to: "/agent/overview",     labelKey: "nav.overview",      icon: Home,           roles: ["agent", "manager", "admin", "super_admin"],  group: "agent" },
  { to: "/agent/reservations", labelKey: "nav.reservations",  icon: FileText,       roles: ["agent", "manager", "admin", "super_admin"],  group: "agent" },
  { to: "/agent/leads",        labelKey: "nav.leads",         icon: PhoneCall,      roles: ["agent", "manager", "admin", "super_admin"],  group: "agent" },
  { to: "/agent/customers",    labelKey: "nav.customers",     icon: BookUser,       roles: ["agent", "manager", "admin", "super_admin"],  group: "agent" },
  { to: "/agent/follow-ups",   labelKey: "nav.follow_ups",    icon: ClipboardList,  roles: ["agent", "manager", "admin", "super_admin"],  group: "agent" },
  { to: "/agent/documents",    labelKey: "nav.client_docs",   icon: FileText,       roles: ["agent", "manager", "admin", "super_admin"],  group: "agent" },
  // Manager
  { to: "/manager/overview",   labelKey: "nav.manager_overview", icon: BarChart3,   roles: ["manager", "admin", "super_admin"],           group: "manager" },
  { to: "/manager/projects",   labelKey: "nav.projects",      icon: Building2,      roles: ["manager", "admin", "super_admin"],           group: "manager" },
  { to: "/manager/units",      labelKey: "nav.units",         icon: Building2,      roles: ["manager", "admin", "super_admin"],           group: "manager" },
  { to: "/manager/agents",     labelKey: "nav.staff",         icon: Users,          roles: ["manager", "admin", "super_admin"],           group: "manager" },
  { to: "/manager/reservations",labelKey: "nav.all_reservations",icon: FileText,    roles: ["manager", "admin", "super_admin"],           group: "manager" },
  { to: "/manager/reports",    labelKey: "nav.reports",       icon: BarChart3,      roles: ["manager", "admin", "super_admin"],           group: "manager" },
  { to: "/manager/waiting-list",labelKey: "nav.waitlist",     icon: ClipboardList,  roles: ["manager", "admin", "super_admin"],           group: "manager" },
  // Admin
  { to: "/admin/overview",     labelKey: "nav.platform_overview", icon: LayoutDashboard, roles: ["admin", "super_admin"],                group: "admin" },
  { to: "/admin/settings",     labelKey: "nav.settings",      icon: Settings,       roles: ["admin", "super_admin"],                     group: "admin" },
  { to: "/admin/activity-logs",labelKey: "nav.activity",      icon: ClipboardList,  roles: ["admin", "super_admin"],                     group: "admin" },
  // Super Admin
  { to: "/platform-admin",     labelKey: "nav.platform_admin",icon: ShieldCheck,   roles: ["super_admin"],                              group: "super_admin" },
  // Shared
  { to: "/notifications",      labelKey: "nav.notifications", icon: Bell,           roles: ["customer", "agent", "manager", "admin", "super_admin"] },
];

const GROUP_LABELS: Record<string, string> = {
  customer:    "nav.group_customer",
  agent:       "nav.group_agent",
  manager:     "nav.group_manager",
  admin:       "nav.group_admin",
  super_admin: "nav.group_platform",
};

function initials(name?: string | null) {
  if (!name) return "؟";
  return name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

interface Props { isOpen: boolean; onClose: () => void }

export function Sidebar({ isOpen, onClose }: Props) {
  const { t } = useTranslation("common");
  const tenant = useTenantStore((s) => s.tenant);
  const user = useAuthStore((s) => s.user);
  const { appName } = useTenantUi();
  const { pathname, search } = useLocation();
  const role = user?.role ?? "customer";

  const items = NAV.filter((n) => n.roles.includes(role));
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);
  const isRtl = typeof document !== "undefined" && document.documentElement.dir === "rtl";

  // Group items by their group label (only show group dividers when > 1 group)
  const groups = items.reduce<{ key: string; items: NavItem[] }[]>((acc, item) => {
    const key = item.group ?? "_";
    const existing = acc.find((g) => g.key === key);
    if (existing) { existing.items.push(item); }
    else { acc.push({ key, items: [item] }); }
    return acc;
  }, []);

  const multipleGroups = groups.length > 1;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[color-mix(in_oklch,var(--color-foreground)_60%,transparent)] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 flex w-64 flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground shadow-2xl shadow-ink/10 transition-transform duration-300",
          "lg:static lg:translate-x-0 lg:shadow-none",
          isOpen
            ? "translate-x-0"
            : isRtl
            ? "translate-x-full lg:translate-x-0"
            : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* ── Brand header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-sidebar-border/50">
          <div className="flex items-center gap-3 min-w-0">
            {tenant?.logo_url ? (
              <img
                src={tenant.logo_url}
                alt={appName}
                className="h-8 w-8 shrink-0 rounded-lg object-contain"
              />
            ) : (
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-background/80 text-foreground ring-1 ring-sidebar-border">
                <Sparkles className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{appName}</p>
              {tenant?.tenant_ui_config?.branding?.tagline && (
                <p className="truncate text-[10px] text-sidebar-foreground/50">
                  {tenant.tenant_ui_config.branding.tagline}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Navigation ───────────────────────────────────────────────── */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3">
          {groups.map(({ key, items: groupItems }) => (
            <div key={key} className="mb-1">
              {multipleGroups && GROUP_LABELS[key] && (
                <p className="mb-1 px-2 pt-2 text-[10px] font-semibold tracking-widest uppercase text-sidebar-foreground/40">
                  {t(GROUP_LABELS[key] ?? key)}
                </p>
              )}
              {groupItems.map(({ to, labelKey, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={withTenant(to)}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-foreground text-background"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-background" : "")} />
                      <span className="truncate">{t(labelKey)}</span>
                      {isActive && <ChevronRight className="ms-auto h-3 w-3 opacity-50" />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* ── User footer ──────────────────────────────────────────────── */}
        <div className="border-t border-sidebar-border/50 px-3 py-3">
          <NavLink
            to={withTenant("/profile")}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
                isActive
                  ? "bg-foreground text-background"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )
            }
          >
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={user?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {initials(user?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.full_name ?? t("nav.profile")}</p>
              <p className="truncate text-[11px] opacity-60">{t(`roles.${role}`, { defaultValue: role })}</p>
            </div>
          </NavLink>
        </div>
      </aside>
    </>
  );
}
