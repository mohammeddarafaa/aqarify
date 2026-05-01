import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { appendTenantSearch } from "@/lib/tenant-path";
import {
  Home, MapPinned, Heart, UserCircle2,
} from "lucide-react";

type BottomItem = {
  to: string;
  icon: React.ElementType;
  roles: string[]; 
}

const BOTTOM_NAV: BottomItem[] = [
  { to: "/customer/dashboard", icon: Home, roles: ["customer"] },
  { to: "/browse", icon: MapPinned, roles: ["customer"] },
  { to: "/favorites", icon: Heart, roles: ["customer", "agent", "manager", "admin", "super_admin"] },
  { to: "/profile", icon: UserCircle2, roles: ["customer", "agent", "manager", "admin", "super_admin"] },
  { to: "/agent/overview", icon: Home, roles: ["agent"] },
  { to: "/manager/overview", icon: Home, roles: ["manager"] },
  { to: "/admin/overview", icon: Home, roles: ["admin", "super_admin"] },
];

export function MobileBottomNav() {
  const user = useAuthStore((s) => s.user);
  const { pathname, search } = useLocation();
  const role = user?.role ?? "customer";

  const items = BOTTOM_NAV.filter((n) => n.roles.includes(role));
  if (items.length === 0) return null;

  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);

  return (
    <nav className="fixed inset-x-0 bottom-4 z-40 mx-4 lg:hidden">
      <div className="mx-auto flex h-14 max-w-sm items-center justify-around rounded-full bg-foreground px-2 shadow-xl">
        {items.slice(0, 4).map(({ to, icon: Icon }) => (
          <NavLink
            key={to}
            to={withTenant(to)}
            className={({ isActive }) => cn(
              "relative grid h-11 w-11 place-items-center rounded-full transition-colors",
              isActive
                ? "text-background"
                : "text-muted-foreground hover:text-background/80"
            )}
          >
            <Icon className="h-4.5 w-4.5" />
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
