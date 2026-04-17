import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { MarketingNavbar } from "@/features/marketing/components/marketing-navbar";
import { MarketingFooter } from "@/features/marketing/components/marketing-footer";

export default function MarketingLayout() {
  // Aqarify marketing site is English-only and LTR — override any tenant
  // theme hook that might have flipped the document to RTL.
  useEffect(() => {
    const root = document.documentElement;
    const prevDir = root.dir;
    const prevLang = root.lang;
    root.dir = "ltr";
    root.lang = "en";
    root.classList.add("aqarify-marketing");
    return () => {
      root.dir = prevDir;
      root.lang = prevLang;
      root.classList.remove("aqarify-marketing");
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <MarketingNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  );
}
