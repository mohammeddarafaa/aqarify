import { motion, useReducedMotion } from "motion/react";
import { FadeInView } from "@/components/motion/fade-in-view";
import { motionTransitions } from "@/components/ui-kit";

const amenities = [
  { num: "01", label: "أمن 24 ساعة", desc: "حراسة مشددة وكاميرات مراقبة متطورة على مدار الساعة" },
  { num: "02", label: "إنترنت فائق السرعة", desc: "تغطية فايبر شاملة لجميع الوحدات والمناطق المشتركة" },
  { num: "03", label: "مواقف خاصة", desc: "موقف سيارات خاص لكل وحدة مع بوابات ذكية" },
  { num: "04", label: "مساحات خضراء", desc: "حدائق مصممة بعناية ومناطق ترفيهية عائلية" },
  { num: "05", label: "نادي رياضي", desc: "صالة رياضية مجهزة بأحدث الأجهزة ومسابح للأطفال والبالغين" },
  { num: "06", label: "قريب من كل شيء", desc: "على مقربة من المدارس الدولية والمراكز التجارية الكبرى" },
];

export function AmenitiesSection() {
  const shouldReduceMotion = useReducedMotion();
  return (
    <section id="amenities" className="bg-background py-24">
      <div className="max-w-screen-xl mx-auto px-6">
        {/* Section header */}
        <FadeInView>
          <p className="label-overline mb-5">المميزات</p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 pb-8 border-b border-[var(--color-border)]">
            <h2 className="display-lg text-foreground">
              حياة استثنائية
              <br />
              في كل تفصيلة.
            </h2>
            <p className="text-[15px] text-muted-foreground leading-relaxed max-w-xs">
              كل ما تحتاجه لحياة مريحة وراقية مصمم بعناية في مكان واحد.
            </p>
          </div>
        </FadeInView>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {amenities.map((item, i) => (
            <motion.div
              key={item.num}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...motionTransitions.layout, delay: i * 0.06 }}
              className="border-b border-e border-[var(--color-border)] p-8 group hover:bg-muted/40 transition-colors"
            >
              <span className="label-overline block mb-6">{item.num}</span>
              <h3 className="text-lg font-semibold text-foreground mb-3">{item.label}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
