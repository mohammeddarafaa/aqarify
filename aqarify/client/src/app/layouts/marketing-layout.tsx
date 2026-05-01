import { Outlet } from "react-router-dom";
import { MarketingNavbar } from "@/features/marketing/components/marketing-navbar";
import { MarketingFooter } from "@/features/marketing/components/marketing-footer";

export default function MarketingLayout() {
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
