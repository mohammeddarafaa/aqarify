import { FadeInView } from "@/components/motion/fade-in-view";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { useTenantStore } from "@/stores/tenant.store";
import { useTenantUi } from "@/hooks/use-tenant-ui";

export function ContactSection() {
  const tenant = useTenantStore((s) => s.tenant);
  const { ui } = useTenantUi();
  const phone = tenant?.contact_phone ?? "+201000000000";
  const waLink = `https://wa.me/${phone.replace(/\D/g, "")}`;

  return (
    <section id="contact" className="bg-[#141414] text-white py-24">
      <div className="max-w-screen-xl mx-auto px-6">
        <FadeInView>
          <p className="label-overline mb-5 text-white/50">تواصل معنا</p>
        </FadeInView>

        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Left — info */}
          <FadeInView>
            <h2 className="display-lg text-white mb-8">
              {ui?.content.contact_title ?? "دعنا نساعدك"}
              <br />
              في اختيارك.
            </h2>
            <p className="text-[15px] text-white/50 leading-relaxed mb-12 max-w-sm">
              {ui?.content.contact_description ??
                "فريقنا جاهز للإجابة على جميع استفساراتك ومساعدتك في اختيار وحدتك المثالية."}
            </p>

            <div className="space-y-0 border-t border-white/10">
              {[
                { icon: Phone, label: "اتصل بنا", value: phone, href: `tel:${phone}` },
                { icon: MessageCircle, label: "واتساب", value: "تواصل عبر واتساب", href: waLink },
                { icon: Mail, label: "البريد الإلكتروني", value: tenant?.contact_email ?? "info@example.com", href: `mailto:${tenant?.contact_email ?? ""}` },
                { icon: MapPin, label: "الموقع", value: tenant?.address ?? "القاهرة الجديدة، مصر", href: "#map" },
              ].map(({ icon: Icon, label, value, href }) => (
                <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="flex items-center gap-5 py-5 border-b border-white/10 hover:opacity-60 transition-opacity group">
                  <Icon className="h-4 w-4 text-[var(--color-gold)] shrink-0" />
                  <div>
                    <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/40 mb-0.5">{label}</p>
                    <p className="text-sm text-white">{value}</p>
                  </div>
                </a>
              ))}
            </div>
          </FadeInView>

          {/* Right — form */}
          <FadeInView delay={0.2}>
            <form className="space-y-0 border-t border-white/10" onSubmit={(e) => e.preventDefault()}>
              <h3 className="text-[11px] font-medium tracking-[0.2em] uppercase text-white/40 py-5 border-b border-white/10">
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
                  className="w-full bg-transparent border-b border-white/10 py-5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30 transition-colors font-[var(--font-arabic)]"
                />
              ))}
              <textarea
                placeholder="رسالتك..."
                rows={4}
                className="w-full bg-transparent border-b border-white/10 py-5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30 transition-colors resize-none font-[var(--font-arabic)]"
              />
              <div className="pt-6">
                <button type="submit"
                  className="btn-luxury text-[11px] border-white text-white hover:bg-white hover:text-[#141414]">
                  إرسال الرسالة →
                </button>
              </div>
            </form>
          </FadeInView>
        </div>
      </div>
    </section>
  );
}
