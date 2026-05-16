import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { X, Search, Menu, CircleUserRound, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTenantStore } from "@/stores/tenant.store";
import { useAuthStore } from "@/stores/auth.store";
import { useUIStore } from "@/stores/ui.store";
import { useTenantUi } from "@/hooks/use-tenant-ui";
import { cn } from "@/lib/utils";
import { appendTenantSearch } from "@/lib/tenant-path";
import { motionTransitions } from "@/components/motion/presets";

export function Navbar() {
  const { t } = useTranslation("common");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const tenant = useTenantStore((s) => s.tenant);
  const { appName } = useTenantUi();
  const { isAuthenticated } = useAuthStore();
  const { language, setLanguage } = useUIStore();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const links = [
    { label: t("nav.projects"), to: "/browse" },
    { label: t("nav.contact"),  to: "/#contact" },
  ];

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled
            ? "border-b border-border bg-background/95 backdrop-blur"
            : "bg-background",
        )}
      >
        <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between gap-8 px-6">
          {/* ── Logo ──────────────────────────────────────────────────── */}
          <Link to={withTenant("/")} className="flex shrink-0 items-center gap-2">
            {tenant?.logo_url ? (
              <img
                src={tenant.logo_url}
                alt={appName}
                className="h-10 object-contain"
              />
            ) : (
              <div className="flex flex-col leading-none">
                <span className="text-base font-bold uppercase tracking-widest text-foreground">
                  {appName}
                </span>
                {tenant?.tenant_ui_config?.branding?.tagline && (
                  <span className="mt-0.5 text-[9px] font-medium tracking-[0.22em] uppercase text-muted-foreground">
                    {tenant.tenant_ui_config.branding.tagline}
                  </span>
                )}
              </div>
            )}
          </Link>

          {/* ── Desktop nav ───────────────────────────────────────────── */}
          <nav className="hidden flex-1 items-center justify-center gap-7 lg:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                to={withTenant(l.to)}
                className="text-[13px] font-medium text-foreground transition-opacity hover:opacity-50"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* ── Desktop actions ───────────────────────────────────────── */}
          <div className="hidden shrink-0 items-center gap-5 lg:flex">
            {/* Language switcher */}
            <div className="inline-flex items-center rounded-full border border-border bg-background p-0.5">
              {(["ar", "en"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-semibold tracking-wider uppercase transition-all",
                    language === lang
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {lang === "ar" ? "ع" : "EN"}
                </button>
              ))}
            </div>

            {isAuthenticated ? (
              <Link
                to={withTenant("/customer/dashboard")}
                className="flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-80"
              >
                <CircleUserRound className="h-4 w-4" />
                {t("nav.dashboard")}
              </Link>
            ) : (
              <>
                <Link
                  to={withTenant("/login")}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  to={withTenant("/register")}
                  className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-80"
                >
                  {t("nav.register")}
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile menu button ────────────────────────────────────── */}
          <button
            className="grid h-9 w-9 place-items-center rounded-full border border-border lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={t("topbar.open_menu")}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-nav"
            initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={motionTransitions.snappy}
            className="fixed inset-x-0 top-16 z-40 border-b border-border bg-background/95 px-6 pb-6 pt-4 backdrop-blur"
          >
            <nav className="flex flex-col gap-4">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={withTenant(l.to)}
                  onClick={() => setMobileOpen(false)}
                  className="text-base font-medium text-foreground"
                >
                  {l.label}
                </Link>
              ))}
              <hr className="border-border" />
              {isAuthenticated ? (
                <Link
                  to={withTenant("/customer/dashboard")}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-full bg-foreground py-2.5 text-center text-sm font-semibold text-background"
                >
                  {t("nav.dashboard")}
                </Link>
              ) : (
                <>
                  <Link
                    to={withTenant("/login")}
                    onClick={() => setMobileOpen(false)}
                    className="text-center text-sm font-medium text-muted-foreground"
                  >
                    {t("nav.login")}
                  </Link>
                  <Link
                    to={withTenant("/register")}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-full bg-foreground py-2.5 text-center text-sm font-semibold text-background"
                  >
                    {t("nav.register")}
                  </Link>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer to push content below fixed header */}
      <div className="h-16" />
    </>
  );
}
