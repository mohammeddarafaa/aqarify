import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { appendTenantSearch } from "@/lib/tenant-path";
import {
  Home, Search, FileText, CreditCard, Bell, UserCircle2,
  ClipboardList, BarChart3, PhoneCall, Building2,
} from "lucide-react";
import { useNotificationBell } from "@/features/notifications/hooks/use-notification-bell";

type BottomItem = {
  to: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
  badge?: boolean;
}

const BOTTOM_NAV: BottomItem[] = [
  // Customer
  { to: "/customer/dashboard", label: "الرئيسية", icon: Home, roles: ["customer"] },
  { to: "/browse", label: "تصفح", icon: Search, roles: ["customer"] },
  { to: "/reservations", label: "حجوزاتي", icon: FileText, roles: ["customer"] },
  { to: "/payments", label: "مدفوعاتي", icon: CreditCard, roles: ["customer"] },
  { to: "/notifications", label: "إشعارات", icon: Bell, roles: ["customer"], badge: true },
  // Agent
  { to: "/agent/overview", label: "الرئيسية", icon: Home, roles: ["agent"] },
  { to: "/agent/leads", label: "العملاء", icon: PhoneCall, roles: ["agent"] },
  { to: "/agent/reservations", label: "الحجوزات", icon: FileText, roles: ["agent"] },
  { to: "/agent/follow-ups", label: "المتابعات", icon: ClipboardList, roles: ["agent"] },
  { to: "/notifications", label: "إشعارات", icon: Bell, roles: ["agent"], badge: true },
  // Manager
  { to: "/manager/overview", label: "الرئيسية", icon: BarChart3, roles: ["manager"] },
  { to: "/manager/units", label: "الوحدات", icon: Building2, roles: ["manager"] },
  { to: "/manager/reservations", label: "الحجوزات", icon: FileText, roles: ["manager"] },
  { to: "/manager/reports", label: "التقارير", icon: BarChart3, roles: ["manager"] },
  { to: "/notifications", label: "إشعارات", icon: Bell, roles: ["manager"], badge: true },
  // Admin
  { to: "/admin/overview", label: "الرئيسية", icon: Home, roles: ["admin", "super_admin"] },
  { to: "/admin/settings", label: "الإعدادات", icon: Building2, roles: ["admin", "super_admin"] },
  { to: "/notifications", label: "إشعارات", icon: Bell, roles: ["admin", "super_admin"], badge: true },
  { to: "/profile", label: "حسابي", icon: UserCircle2, roles: ["admin", "super_admin"] },
];

export function MobileBottomNav() {
  const user = useAuthStore((s) => s.user);
  const { pathname, search } = useLocation();
  const { count } = useNotificationBell();
  const role = user?.role ?? "customer";

  const items = BOTTOM_NAV.filter((n) => n.roles.includes(role));
  if (items.length === 0) return null;

  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-around px-1 py-1 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={withTenant(to)}
            className={({ isActive }) => cn(
              "relative flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl min-w-[56px] transition-colors",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  "relative flex items-center justify-center w-10 h-7 rounded-xl transition-colors",
                  isActive && "bg-primary/10"
                )}>
                  <Icon className={cn("h-4.5 w-4.5", isActive ? "text-primary" : "text-muted-foreground")} />
                  {badge && count > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[9px] text-white flex items-center justify-center font-bold">
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium leading-none",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
