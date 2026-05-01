import { MailIcon, PhoneIcon, MapPinIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const channels = [
  {
    icon: MailIcon,
    label: "Email sales",
    value: "sales@aqarify.com",
    href: "mailto:sales@aqarify.com",
  },
  {
    icon: PhoneIcon,
    label: "Call us",
    value: "+20 100 000 0000",
    href: "tel:+201000000000",
  },
  {
    icon: MapPinIcon,
    label: "Visit",
    value: "Smart Village, Giza, Egypt",
    href: "#",
  },
];

export function ContactSection() {
  return (
    <section
      id="contact"
      className="border-t border-border bg-muted/30"
    >
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-2 md:items-center">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Talk to us
          </div>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
            Prefer a walkthrough
            <br /> before you sign up?
          </h2>
          <p className="mt-5 max-w-md text-pretty text-base text-muted-foreground">
            Our team will give you a 20-minute tour of a live tenant, answer
            migration questions, and help you pick the right plan for your
            portfolio.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/signup">Start on your own</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full"
            >
              <a href="mailto:sales@aqarify.com">Book a demo</a>
            </Button>
          </div>
        </div>

        <ul className="grid gap-4">
          {channels.map((c) => (
            <li key={c.label}>
              <a
                href={c.href}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-background p-5 transition-colors hover:border-foreground"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-muted text-foreground">
                  <c.icon className="size-5" />
                </span>
                <span className="flex-1">
                  <span className="block text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                    {c.label}
                  </span>
                  <span className="mt-1 block text-sm font-medium text-foreground">
                    {c.value}
                  </span>
                </span>
                <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
