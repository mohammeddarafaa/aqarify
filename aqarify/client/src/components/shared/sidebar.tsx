import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTenantStore } from "@/stores/tenant.store";
import { useAuthStore } from "@/stores/auth.store";
import { appendTenantSearch } from "@/lib/tenant-path";
import {
  Home, Search, FileText, CreditCard, Users, BarChart3,
  Settings, Bell, Building2, ClipboardList, X, PhoneCall,
} from "lucide-react";

type NavItem = { to: string; label: string; icon: React.ElementType; roles: string[] };

const NAV: NavItem[] = [
  { to: "/customer/dashboard", label: "نظرة عامة", icon: Home, roles: ["customer"] },
  { to: "/browse", label: "تصفح الوحدات", icon: Search, roles: ["customer"] },
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

interface Props { isOpen: boolean; onClose: () => void }

export function Sidebar({ isOpen, onClose }: Props) {
  const tenant = useTenantStore((s) => s.tenant);
  const user = useAuthStore((s) => s.user);
  const { pathname, search } = useLocation();
  const role = user?.role ?? "customer";
  const items = NAV.filter((n) => n.roles.includes(role));
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onClose} />
      )}
      <aside className={cn(
        "fixed inset-y-0 right-0 z-50 flex w-64 flex-col bg-[#141414] transition-transform duration-300 lg:static lg:translate-x-0",
        isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          {tenant?.logo_url ? (
            <img src={tenant.logo_url} alt={tenant.name} className="h-7 object-contain brightness-0 invert" />
          ) : (
            <div className="flex flex-col leading-none">
              <span className="text-[13px] font-bold tracking-widest text-white uppercase">
                {tenant?.name ?? "Aqarify"}
              </span>
              <span className="text-[8px] font-medium tracking-[0.2em] text-white/40 uppercase mt-0.5">
                Real Estate
              </span>
            </div>
          )}
          <button onClick={onClose} className="lg:hidden text-white/40 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={withTenant(to)}
              onClick={onClose}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-5 py-3 text-[11px] font-medium tracking-[0.1em] uppercase transition-all",
                isActive
                  ? "text-white border-e-2 border-[var(--color-gold)] bg-white/5"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              )}>
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-[10px] font-medium text-white/60 truncate uppercase tracking-widest">
            {user?.full_name}
          </p>
          <p className="text-[9px] text-white/30 truncate mt-0.5">{user?.email}</p>
        </div>
      </aside>
    </>
  );
}
