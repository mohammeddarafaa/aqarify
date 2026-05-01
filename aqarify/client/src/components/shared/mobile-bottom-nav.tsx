import type { ElementType } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/stores/auth.store";
import { useAuthStore } from "@/stores/auth.store";
import { appendTenantSearch } from "@/lib/tenant-path";
import { Home, LogIn, MapPinned, Heart, UserCircle2, Scaling } from "lucide-react";

type BottomItem = {
  to: string;
  label: string;
  icon: ElementType<{ className?: string; "aria-hidden"?: boolean }>;
  /** Use `NavLink` `end` so `/` doesn’t stay active on every nested route */
  matchEnd?: boolean;
};

const GUEST_ITEMS: BottomItem[] = [
  { to: "/", label: "الرئيسية", icon: Home, matchEnd: true },
  { to: "/browse", label: "تصفح", icon: MapPinned },
  { to: "/compare", label: "مقارنة", icon: Scaling },
  { to: "/favorites", label: "المفضلة", icon: Heart },
  { to: "/login", label: "دخول", icon: LogIn },
];

const CUSTOMER_ITEMS: BottomItem[] = [
  { to: "/customer/dashboard", label: "الرئيسية", icon: Home, matchEnd: true },
  { to: "/browse", label: "تصفح", icon: MapPinned },
  { to: "/compare", label: "مقارنة", icon: Scaling },
  { to: "/favorites", label: "المفضلة", icon: Heart },
  { to: "/profile", label: "الحساب", icon: UserCircle2 },
];

/** Bottom bar is only for guests and customers—not staff dashboards. */
export function isMobileBottomNavAudience(user: AuthUser | null): boolean {
  return user == null || user.role === "customer";
}

export function MobileBottomNav() {
  const user = useAuthStore((s) => s.user);
  const { pathname, search } = useLocation();

  if (!isMobileBottomNavAudience(user)) return null;

  const items = user ? CUSTOMER_ITEMS : GUEST_ITEMS;
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 lg:hidden"
      aria-label="التنقل السفلي"
    >
      <div
        className={cn(
          "mx-auto flex max-w-lg items-stretch justify-between gap-0.5 rounded-[1.75rem] border border-[color-mix(in_oklch,var(--color-background)_14%,transparent)] bg-foreground/95 px-1 py-1.5 shadow-[0_12px_40px_-8px_rgb(0_0_0/0.45)] backdrop-blur-xl",
          "supports-[backdrop-filter]:bg-foreground/88",
        )}
      >
        {items.map(({ to, label, icon: Icon, matchEnd }) => (
          <NavLink
            key={to}
            to={withTenant(to)}
            aria-label={label}
            end={matchEnd ?? false}
            className={({ isActive }) =>
              cn(
                "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-center transition-[transform,background-color,color,box-shadow] duration-200 ease-out",
                "active:scale-[0.96]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-foreground",
                isActive
                  ? "bg-background text-foreground shadow-md shadow-black/15"
                  : "text-[color-mix(in_oklch,var(--color-background)_72%,transparent)] hover:bg-[color-mix(in_oklch,var(--color-background)_12%,transparent)] hover:text-background",
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    "relative grid size-9 shrink-0 place-items-center rounded-full transition-colors",
                    isActive && "text-foreground",
                  )}
                  aria-hidden
                >
                  <Icon className="size-[1.15rem] stroke-[1.85]" />
                </span>
                <span
                  className={cn(
                    "max-w-full truncate text-[9px] font-semibold leading-none tracking-tight",
                    isActive ? "text-foreground" : "text-inherit opacity-95",
                  )}
                >
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
