import { FadeInView } from "@/components/motion/fade-in-view";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { useTenantStore } from "@/stores/tenant.store";
import { useTenantUi } from "@/hooks/use-tenant-ui";
import { Button } from "@/components/ui-kit";

export function ContactSection() {
  const tenant = useTenantStore((s) => s.tenant);
  const { ui } = useTenantUi();
  const phone = tenant?.contact_phone ?? "+201000000000";
  const waLink = `https://wa.me/${phone.replace(/\D/g, "")}`;

  return (
    <section id="contact" className="bg-foreground text-background py-24">
      <div className="max-w-screen-xl mx-auto px-6">
        <FadeInView>
          <p className="label-overline mb-5 text-background/50">تواصل معنا</p>
        </FadeInView>

        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Left — info */}
          <FadeInView>
            <h2 className="display-lg text-background mb-8">
              {ui?.content.contact_title ?? "دعنا نساعدك"}
              <br />
              في اختيارك.
            </h2>
            <p className="text-[15px] text-background/55 leading-relaxed mb-12 max-w-sm">
              {ui?.content.contact_description ??
                "فريقنا جاهز للإجابة على جميع استفساراتك ومساعدتك في اختيار وحدتك المثالية."}
            </p>

            <div className="space-y-0 border-t border-background/15">
              {[
                { icon: Phone, label: "اتصل بنا", value: phone, href: `tel:${phone}` },
                { icon: MessageCircle, label: "واتساب", value: "تواصل عبر واتساب", href: waLink },
                { icon: Mail, label: "البريد الإلكتروني", value: tenant?.contact_email ?? "info@example.com", href: `mailto:${tenant?.contact_email ?? ""}` },
                { icon: MapPin, label: "الموقع", value: tenant?.address ?? "القاهرة الجديدة، مصر", href: "#map" },
              ].map(({ icon: Icon, label, value, href }) => (
                <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="flex items-center gap-5 py-5 border-b border-background/15 hover:opacity-70 transition-opacity group">
                  <Icon className="h-4 w-4 text-[var(--color-gold)] shrink-0" />
                  <div>
                    <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-background/45 mb-0.5">{label}</p>
                    <p className="text-sm text-background">{value}</p>
                  </div>
                </a>
              ))}
            </div>
          </FadeInView>

          {/* Right — form */}
          <FadeInView delay={0.2}>
            <form className="space-y-0 border-t border-background/15" onSubmit={(e) => e.preventDefault()}>
              <h3 className="text-[11px] font-medium tracking-[0.2em] uppercase text-background/45 py-5 border-b border-background/15">
                أرسل استفسارك
              </h3>
              {[
                { placeholder: "الاسم الكامل", type: "text" },
                { placeholder: "رقم الهاتف", type: "tel" },
                { placeholder: "البريد الإلكتروني", type: "email" },
              ].map((f) => (
                <input
                  key={f.placeholder}
                  type={f.type}
                  placeholder={f.placeholder}
                  className="w-full bg-transparent border-b border-background/15 py-5 text-sm text-background placeholder:text-background/40 outline-none focus:border-background/35 transition-colors font-[var(--font-arabic)]"
                />
              ))}
              <textarea
                placeholder="رسالتك..."
                rows={4}
                className="w-full bg-transparent border-b border-background/15 py-5 text-sm text-background placeholder:text-background/40 outline-none focus:border-background/35 transition-colors resize-none font-[var(--font-arabic)]"
              />
              <div className="pt-6">
                <Button type="submit" variant="outline" className="rounded-full border-background text-background hover:bg-background hover:text-foreground">
                  إرسال الرسالة
                </Button>
              </div>
            </form>
          </FadeInView>
        </div>
      </div>
    </section>
  );
}
