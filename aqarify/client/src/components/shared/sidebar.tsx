import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTenantStore } from "@/stores/tenant.store";
import { useAuthStore } from "@/stores/auth.store";
import { appendTenantSearch } from "@/lib/tenant-path";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  Search,
  FileText,
  CreditCard,
  Users,
  BarChart3,
  Settings,
  Bell,
  Building2,
  ClipboardList,
  X,
  PhoneCall,
  Sparkles,
} from "lucide-react";

type NavItem = { to: string; label: string; icon: React.ElementType; roles: string[] }

const NAV: NavItem[] = [
  { to: "/customer/dashboard", label: "نظرة عامة", icon: Home, roles: ["customer"] },
  { to: "/browse", label: "تصفح المشاريع", icon: Search, roles: ["customer"] },
  { to: "/reservations", label: "حجوزاتي", icon: FileText, roles: ["customer"] },
  { to: "/payments", label: "مدفوعاتي", icon: CreditCard, roles: ["customer"] },
  { to: "/waitlist", label: "قائمة الانتظار", icon: ClipboardList, roles: ["customer"] },
  { to: "/documents", label: "مستنداتي", icon: FileText, roles: ["customer"] },
  { to: "/agent/overview", label: "نظرة عامة", icon: Home, roles: ["agent", "manager", "admin", "super_admin"] },
  { to: "/agent/reservations", label: "الحجوزات", icon: FileText, roles: ["agent", "manager", "admin", "super_admin"] },
  { to: "/agent/leads", label: "العملاء المحتملين", icon: PhoneCall, roles: ["agent", "manager", "admin", "super_admin"] },
  { to: "/agent/follow-ups", label: "المتابعات", icon: ClipboardList, roles: ["agent", "manager", "admin", "super_admin"] },
  { to: "/agent/documents", label: "مستندات العملاء", icon: FileText, roles: ["agent", "manager", "admin", "super_admin"] },
  { to: "/manager/overview", label: "نظرة عامة المدير", icon: BarChart3, roles: ["manager", "admin", "super_admin"] },
  { to: "/manager/projects", label: "المشاريع", icon: Building2, roles: ["manager", "admin", "super_admin"] },
  { to: "/manager/units", label: "الوحدات", icon: Building2, roles: ["manager", "admin", "super_admin"] },
  { to: "/manager/agents", label: "الموظفون", icon: Users, roles: ["manager", "admin", "super_admin"] },
  { to: "/manager/reservations", label: "حجوزات العملاء", icon: FileText, roles: ["manager", "admin", "super_admin"] },
  { to: "/manager/reports", label: "التقارير", icon: BarChart3, roles: ["manager", "admin", "super_admin"] },
  { to: "/manager/waiting-list", label: "قائمة الانتظار", icon: ClipboardList, roles: ["manager", "admin", "super_admin"] },
  { to: "/admin/overview", label: "نظرة عامة المنصة", icon: Home, roles: ["admin", "super_admin"] },
  { to: "/admin/settings", label: "إعدادات المنصة", icon: Settings, roles: ["admin", "super_admin"] },
  { to: "/admin/activity-logs", label: "سجل النشاط", icon: ClipboardList, roles: ["admin", "super_admin"] },
  { to: "/notifications", label: "الإشعارات", icon: Bell, roles: ["customer", "agent", "manager", "admin", "super_admin"] },
];

function initials(name?: string | null) {
  if (!name) return "؟";
  return name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

interface Props { isOpen: boolean; onClose: () => void }

export function Sidebar({ isOpen, onClose }: Props) {
  const tenant = useTenantStore((s) => s.tenant);
  const user = useAuthStore((s) => s.user);
  const { pathname, search } = useLocation();
  const role = user?.role ?? "customer";
  const items = NAV.filter((n) => n.roles.includes(role));
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);
  const isRtl = typeof document !== "undefined" && document.documentElement.dir === "rtl";

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-[color-mix(in_oklch,var(--color-foreground)_60%,transparent)] lg:hidden" onClick={onClose} />
      )}
      <aside className={cn(
        "fixed inset-y-0 start-0 z-50 flex w-20 flex-col border-e border-sidebar-border bg-sidebar/95 text-sidebar-foreground shadow-2xl shadow-ink/10 backdrop-blur transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-none",
        isOpen ? "translate-x-0" : isRtl ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center justify-between px-4 py-5">
          {tenant?.logo_url ? (
            <img src={tenant.logo_url} alt={tenant.name} className="h-8 w-8 rounded-full object-contain" />
          ) : (
            <div className="grid h-9 w-9 place-items-center rounded-full bg-background text-foreground ring-1 ring-sidebar-border">
              <Sparkles className="h-5 w-5" />
            </div>
          )}
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-background/80 text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground lg:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col items-center gap-2 overflow-y-auto px-3 py-2">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={withTenant(to)}
              onClick={onClose}
              title={label}
              className={({ isActive }) => cn(
                "grid h-12 w-12 place-items-center rounded-full text-sidebar-foreground/65 transition-all",
                isActive
                  ? "bg-foreground text-background shadow-lg shadow-ink/15"
                  : "bg-background/60 hover:bg-background hover:text-sidebar-foreground"
              )}>
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="sr-only">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-col items-center gap-2 px-3 pb-5 pt-3">
          <NavLink
            to={withTenant("/profile")}
            onClick={onClose}
            title={user?.full_name ?? "Profile"}
            className={({ isActive }) => cn(
              "grid h-12 w-12 place-items-center rounded-full transition-all",
              isActive ? "bg-foreground" : "bg-background/70 hover:bg-background"
            )}
          >
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={user?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-lime text-xs font-semibold text-lime-foreground">
                {initials(user?.full_name)}
              </AvatarFallback>
            </Avatar>
          </NavLink>
        </div>
      </aside>
    </>
  );
}
