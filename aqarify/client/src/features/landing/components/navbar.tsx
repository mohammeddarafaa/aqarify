import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, Menu, CircleUserRound } from "lucide-react";
import { useTenantStore } from "@/stores/tenant.store";
import { useAuthStore } from "@/stores/auth.store";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@/lib/utils";
import { appendTenantSearch } from "@/lib/tenant-path";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
    { label: "المشاريع", to: "/browse" },
    { label: "المزايا", to: "/#amenities" },
    { label: "تواصل", to: "/#contact" },
  ];

  return (
    <>
      <header className={cn("fixed top-0 inset-x-0 z-50 transition-all duration-500", scrolled ? "bg-white border-b border-[var(--color-border)]" : "bg-white")}>
        <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Logo */}
          <Link to={withTenant("/")} className="flex items-center gap-2 shrink-0">
            {tenant?.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name} className="h-10 object-contain" />
            ) : (
              <div className="flex flex-col leading-none">
                <span className="text-base font-bold tracking-widest text-[#141414] uppercase">
                  {tenant?.name ?? "المطور"}
                </span>
                <span className="text-[9px] font-medium tracking-[0.22em] text-[#888888] uppercase mt-0.5">
                  Real Estate
                </span>
              </div>
            )}
          </Link>

          <nav className="hidden lg:flex items-center gap-7 flex-1 justify-center">
            {links.map((l) => (
              <Link key={l.to + l.label} to={withTenant(l.to)}
                className="nav-link text-[13px] text-[#141414] hover:opacity-50 transition-opacity font-medium">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-5 shrink-0">
            <button
              onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
              className="text-[11px] font-medium tracking-widest uppercase text-[#888888] hover:text-[#141414] transition-colors">
              {language === "ar" ? "EN" : "عر"}
            </button>
            <Link to={withTenant("/browse")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d0d0d0] text-[#141414] hover:bg-[#141414] hover:text-white transition-colors">
              <Search className="h-4 w-4" />
            </Link>
            {!isAuthenticated ? (
              <Link
                to={withTenant("/login?as=team")}
                className="hidden xl:inline-flex items-center gap-1.5 text-[11px] font-medium tracking-widest uppercase text-[#888888] hover:text-[#141414] transition-colors"
                title="بوابة الموظفين"
              >
                دخول الفريق
              </Link>
            ) : null}
            <button
              onClick={() =>
                navigate(withTenant(isAuthenticated ? "/dashboard" : "/login"))
              }
              className="flex items-center gap-3 border rounded-full px-3 py-2 hover:shadow-sm transition-all border-[var(--color-border)] bg-transparent"
            >
              <Menu className="h-4 w-4 text-[#555]" />
              <CircleUserRound className="h-5 w-5" style={{ color: "var(--color-gold)" }} />
            </button>
          </div>

          {/* Mobile hamburger circle */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-full border border-[#141414]"
            aria-label="فتح القائمة">
            <div className="flex flex-col gap-1.5">
              <span className="block h-px w-4 bg-[#141414]" />
              <span className="block h-px w-4 bg-[#141414]" />
            </div>
          </button>
        </div>
      </header>

      {/* Mobile full-screen menu — dark overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] bg-[#141414] text-white flex flex-col px-6 pt-8 pb-10 overflow-y-auto"
          >
            {/* Close */}
            <div className="flex items-center justify-between mb-12">
              <div className="flex flex-col leading-none">
                <span className="text-base font-bold tracking-widest text-white uppercase">
                  {tenant?.name ?? "المطور"}
                </span>
                <span className="text-[9px] font-medium tracking-[0.22em] text-white/50 uppercase mt-0.5">
                  Real Estate
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20">
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Links */}
            <nav className="flex flex-col gap-0 flex-1">
              {links.map((l, i) => (
                <motion.div
                  key={l.to + l.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.3 }}>
                  <Link
                    to={withTenant(l.to)}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between border-b border-white/10 py-5 text-lg font-medium text-white hover:text-white/60 transition-colors">
                    {l.label}
                    <span className="text-white/30 text-sm">→</span>
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Bottom actions */}
            <div className="flex flex-wrap items-center gap-6 pt-8 border-t border-white/10">
              <button
                onClick={() => { setMobileOpen(false); navigate(withTenant("/login")); }}
                className="text-[11px] font-medium tracking-widest uppercase text-white/70 hover:text-white transition-colors">
                دخول العملاء
              </button>
              <button
                onClick={() => { setMobileOpen(false); navigate(withTenant("/login?as=team")); }}
                className="text-[11px] font-medium tracking-widest uppercase text-white/70 hover:text-white transition-colors">
                دخول الفريق
              </button>
              <button
                onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
                className="text-[11px] font-medium tracking-widest uppercase text-white/70 hover:text-white transition-colors ms-auto">
                {language === "ar" ? "EN" : "عر"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
