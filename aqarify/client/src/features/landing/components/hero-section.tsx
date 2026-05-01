import { motion, useReducedMotion } from "motion/react";
import { Link, useLocation } from "react-router-dom";
import { Search, Building2, ShieldCheck, CreditCard, MapPin } from "lucide-react";
import { useTenantStore } from "@/stores/tenant.store";
import { appendTenantSearch } from "@/lib/tenant-path";
import {
  Button,
  Card,
  CardContent,
  ShimmeringText,
  Spotlight,
  motionTransitions,
} from "@/components/ui-kit";

const stats = [
  { value: "500+", label: "وحدة سكنية" },
  { value: "98%", label: "رضا العملاء" },
  { value: "15+", label: "سنة خبرة" },
  { value: "3", label: "مشاريع نشطة" },
];

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion();
  const { pathname, search } = useLocation();
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);
  const tenant = useTenantStore((s) => s.tenant);
  const name = tenant?.name ?? "المطور";
  const area = tenant?.address ?? "مصر";

  const valueCards = [
    {
      icon: Building2,
      title: "وحدات موثقة",
      desc: `عروض محدثة من ${name} مع تفاصيل واضحة لكل وحدة.`,
    },
    {
      icon: MapPin,
      title: "حجز مباشر",
      desc: "تصفح المتاح، احجز خطوتك التالية، وتابع حالة الطلب من لوحتك.",
    },
    {
      icon: CreditCard,
      title: "دفع آمن",
      desc: "مدفوعات مرتبطة بحجزك عبر بوابة الدفع المعتمدة للمطور.",
    },
    {
      icon: ShieldCheck,
      title: "متابعة شفافة",
      desc: "إشعارات وحالة الحجز والمستندات في مكان واحد.",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-background pt-24 pb-14">
      <Spotlight className="left-0 top-0 md:-top-20 md:left-60" />
      <div className="relative max-w-screen-xl mx-auto px-6 w-full">
        <motion.p
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={motionTransitions.layout}
          className="label-overline mb-6">
          <ShimmeringText text={`${name} · ${area}`} />
        </motion.p>

        <div className="overflow-hidden">
          <motion.h1
            initial={shouldReduceMotion ? false : { y: "100%" }}
            animate={shouldReduceMotion ? undefined : { y: 0 }}
            transition={{ ...motionTransitions.layout, duration: 0.7 }}
            className="display-xl text-foreground max-w-5xl">
            اكتشف وحدات {name}
            <br />
            واحجز بخطوات بسيطة وآمنة
          </motion.h1>
        </div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ ...motionTransitions.layout, duration: 0.6, delay: 0.2 }}
          className="grid lg:grid-cols-2 gap-8 mt-10">
          <p className="text-[15px] text-muted-foreground leading-relaxed max-w-xl">
            منصة الحجز الرسمية لـ {name}: تصفح المشاريع المتاحة، قارن الوحدات، وأكمل
            حجزك مع متابعة واضحة من الطلب حتى التأكيد.
          </p>
          <Card className="rounded-3xl border-[var(--color-border)] shadow-none">
            <CardContent className="p-3">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
                <div className="rounded-full border border-[var(--color-border)] h-11 px-4 flex items-center text-sm text-foreground">
                  {tenant?.address ?? "الموقع"}
                </div>
                <div className="rounded-full border border-[var(--color-border)] h-11 px-4 flex items-center text-sm text-foreground">
                  شقق، فيلات، وحدات متنوعة
                </div>
                <Button asChild className="rounded-full h-11 w-11 p-0">
                  <Link to={withTenant("/browse")}>
                    <Search className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1 }}
          transition={{ ...motionTransitions.layout, delay: 0.35 }}
          className="grid grid-cols-2 md:grid-cols-4 mt-12 border-t"
          style={{ borderColor: "var(--color-border)" }}
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ ...motionTransitions.layout, delay: 0.45 + i * 0.06 }}
              className="pt-6 pb-4 pe-6 border-e"
              style={{ borderColor: "var(--color-border)" }}
            >
              <p className="text-3xl font-bold text-foreground tracking-tight">{s.value}</p>
              <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-muted-foreground mt-2">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mt-10">
          {valueCards.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="shadow-none rounded-2xl border-[var(--color-border)]">
              <CardContent className="p-4">
                <Icon className="h-4 w-4 mb-2" style={{ color: "var(--color-gold)" }} />
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                <p className="text-xs mt-1 text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
