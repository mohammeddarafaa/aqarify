import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { X, Search, Menu, CircleUserRound, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTenantStore } from "@/stores/tenant.store";
import { useAuthStore } from "@/stores/auth.store";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@/lib/utils";
import { appendTenantSearch } from "@/lib/tenant-path";
import { motionTransitions } from "@/components/motion/presets";

export function Navbar() {
  const { t } = useTranslation("common");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const tenant = useTenantStore((s) => s.tenant);
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
    { label: t("nav.features"), to: "/#amenities" },
    { label: t("nav.contact"), to: "/#contact" },
  ];

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-500",
          scrolled ? "bg-background/95 backdrop-blur border-b border-border" : "bg-background",
        )}
      >
        <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Logo */}
          <Link to={withTenant("/")} className="flex items-center gap-2 shrink-0">
            {tenant?.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name} className="h-10 object-contain" />
            ) : (
              <div className="flex flex-col leading-none">
                <span className="text-base font-bold tracking-widest text-foreground uppercase">
                  {tenant?.name ?? t("app_name")}
                </span>
                <span className="text-[9px] font-medium tracking-[0.22em] text-muted-foreground uppercase mt-0.5">
                  Real Estate
                </span>
              </div>
            )}
          </Link>

          <nav className="hidden lg:flex items-center gap-7 flex-1 justify-center">
            {links.map((l) => (
              <Link key={l.to + l.label} to={withTenant(l.to)}
                className="nav-link text-[13px] text-foreground hover:opacity-50 transition-opacity font-medium">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-5 shrink-0">
            <div className="inline-flex items-center rounded-full border border-border bg-background p-0.5">
              <button
                type="button"
                onClick={() => setLanguage("ar")}
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[10px] font-semibold tracking-wide transition-colors",
                  language === "ar" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Switch language to Arabic"
              >
                <Languages className="h-3.5 w-3.5" />
                AR
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={cn(
                  "inline-flex h-7 items-center rounded-full px-2.5 text-[10px] font-semibold tracking-wide transition-colors",
                  language === "en" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Switch language to English"
              >
                EN
              </button>
            </div>
            <Link to={withTenant("/browse")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground hover:bg-foreground hover:text-background transition-colors">
              <Search className="h-4 w-4" />
            </Link>
            {!isAuthenticated ? (
              <Link
                to={withTenant("/login?as=team")}
                className="hidden xl:inline-flex items-center gap-1.5 text-[11px] font-medium tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
                title="بوابة الموظفين"
              >
                {t("nav.team_login")}
              </Link>
            ) : null}
            <button
              onClick={() =>
                navigate(withTenant(isAuthenticated ? "/dashboard" : "/login"))
              }
              className="flex items-center gap-3 border rounded-full px-3 py-2 hover:shadow-sm transition-all border-border bg-transparent"
            >
              <Menu className="h-4 w-4 text-muted-foreground" />
              <CircleUserRound className="h-5 w-5" style={{ color: "var(--color-gold)" }} />
            </button>
          </div>

          {/* Mobile hamburger circle */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-full border border-foreground"
            aria-label={t("actions.open_menu", { defaultValue: "Open menu" })}>
            <div className="flex flex-col gap-1.5">
              <span className="block h-px w-4 bg-foreground" />
              <span className="block h-px w-4 bg-foreground" />
            </div>
          </button>
        </div>
      </header>

      {/* Mobile full-screen menu — dark overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            transition={motionTransitions.overlay}
            className="fixed inset-0 z-[100] bg-foreground text-background flex flex-col px-6 pt-8 pb-10 overflow-y-auto"
          >
            {/* Close */}
            <div className="flex items-center justify-between mb-12">
              <div className="flex flex-col leading-none">
                <span className="text-base font-bold tracking-widest text-background uppercase">
                  {tenant?.name ?? t("app_name")}
                </span>
                <span className="text-[9px] font-medium tracking-[0.22em] text-[color-mix(in_oklch,var(--color-background)_50%,transparent)] uppercase mt-0.5">
                  Real Estate
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[color-mix(in_oklch,var(--color-background)_20%,transparent)]">
                <X className="h-4 w-4 text-background" />
              </button>
            </div>

            {/* Links */}
            <nav className="flex flex-col gap-0 flex-1">
              {links.map((l, i) => (
                <motion.div
                  key={l.to + l.label}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ ...motionTransitions.layout, delay: 0.05 * i }}>
                  <Link
                    to={withTenant(l.to)}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between border-b border-[color-mix(in_oklch,var(--color-background)_10%,transparent)] py-5 text-lg font-medium text-background hover:text-[color-mix(in_oklch,var(--color-background)_60%,transparent)] transition-colors">
                    {l.label}
                <span className="text-[color-mix(in_oklch,var(--color-background)_30%,transparent)] text-sm">→</span>
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Bottom actions */}
            <div className="flex flex-wrap items-center gap-6 pt-8 border-t border-[color-mix(in_oklch,var(--color-background)_10%,transparent)]">
              <button
                onClick={() => { setMobileOpen(false); navigate(withTenant("/login")); }}
                className="text-[11px] font-medium tracking-widest uppercase text-[color-mix(in_oklch,var(--color-background)_70%,transparent)] hover:text-background transition-colors">
                {t("nav.login")}
              </button>
              <button
                onClick={() => { setMobileOpen(false); navigate(withTenant("/login?as=team")); }}
                className="text-[11px] font-medium tracking-widest uppercase text-[color-mix(in_oklch,var(--color-background)_70%,transparent)] hover:text-background transition-colors">
                {t("nav.team_login")}
              </button>
              <button
                type="button"
                onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
                className="ms-auto inline-flex items-center gap-1 rounded-full border border-[color-mix(in_oklch,var(--color-background)_20%,transparent)] px-3 py-1.5 text-[11px] font-semibold tracking-wide text-[color-mix(in_oklch,var(--color-background)_70%,transparent)] hover:text-background transition-colors"
              >
                <Languages className="h-3.5 w-3.5" />
                {language === "ar" ? "EN" : "AR"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
