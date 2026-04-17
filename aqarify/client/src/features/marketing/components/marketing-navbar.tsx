import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MenuIcon, XIcon } from "lucide-react";
import { Button, cn } from "@/components/ui-kit";

const LINKS = [
  { hash: "#features", label: "Features" },
  { hash: "#guardrails", label: "Security" },
  { hash: "#pricing", label: "Pricing" },
  { hash: "#faq", label: "FAQ" },
  { hash: "#contact", label: "Contact" },
];

export function MarketingNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function jumpTo(hash: string) {
    setOpen(false);
    if (pathname !== "/") {
      navigate(`/${hash}`);
      return;
    }
    const el = document.getElementById(hash.replace("#", ""));
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", hash);
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-colors duration-200",
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur-md"
          : "border-b border-transparent bg-background",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-base font-semibold tracking-tight"
          aria-label="Aqarify home"
        >
          <span className="grid size-7 place-items-center rounded-md bg-foreground text-background text-sm font-bold">
            A
          </span>
          Aqarify
        </Link>

        <nav className="hidden gap-8 md:flex">
          {LINKS.map((l) => (
            <button
              key={l.hash}
              type="button"
              onClick={() => jumpTo(l.hash)}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="rounded-full">
            <Link to="/signup">Get started</Link>
          </Button>
        </div>

        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="grid size-9 place-items-center rounded-full border border-border md:hidden"
        >
          <MenuIcon className="size-4" />
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-background p-6 md:hidden">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 text-base font-semibold tracking-tight"
            >
              <span className="grid size-7 place-items-center rounded-md bg-foreground text-background text-sm font-bold">
                A
              </span>
              Aqarify
            </Link>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="grid size-9 place-items-center rounded-full border border-border"
            >
              <XIcon className="size-4" />
            </button>
          </div>

          <nav className="mt-8 flex flex-col">
            {LINKS.map((l) => (
              <button
                key={l.hash}
                type="button"
                onClick={() => jumpTo(l.hash)}
                className="border-b border-border py-4 text-start text-lg font-medium text-foreground"
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-3 pt-8">
            <Button asChild size="lg" className="w-full rounded-full">
              <Link to="/signup" onClick={() => setOpen(false)}>
                Get started
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full rounded-full"
            >
              <Link to="/login" onClick={() => setOpen(false)}>
                Sign in
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
