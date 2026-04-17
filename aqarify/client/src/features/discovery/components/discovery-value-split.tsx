import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { Button, Separator } from "@/components/ui-kit";
import { useTenantStore } from "@/stores/tenant.store";
import { appendTenantSearch } from "@/lib/tenant-path";

const SPLIT_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80";

export function DiscoveryValueSplit() {
  const tenant = useTenantStore((s) => s.tenant);
  const { pathname, search } = useLocation();
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);
  const name = tenant?.name ?? "المطور";

  return (
    <section className="bg-white py-20">
      <div className="mx-auto grid max-w-screen-xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
        >
          <p className="label-overline mb-4 text-[var(--color-muted-foreground)]">حول المنصة</p>
          <h2 className="display-lg max-w-lg text-balance text-[#141414]">
            أفضل طريقة لتجد وحدة تناسبك
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#666666]">
            شفافية في الأسعار، تفاصيل الوحدات، ومتابعة الحجز من لوحة واحدة — بدون مفاجآت.
            {name} يقدّم عروضه عبر Aqarify لتجربة حجز موحّدة.
          </p>
          <Separator className="my-8 max-w-md bg-[var(--color-border)]" />
          <ul className="space-y-3 text-sm text-[#444444]">
            {[
              "فلاتر ذكية للمشروع والنوع والمساحة",
              "إشعارات وحالة الحجز في الوقت الفعلي",
              "دفع آمن عبر بوابة معتمدة",
            ].map((line) => (
              <li key={line} className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--color-gold)]" />
                {line}
              </li>
            ))}
          </ul>
          <Button asChild className="mt-10 rounded-full px-8">
            <Link to={withTenant("/browse")}>تصفّح الوحدات</Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="aspect-[4/5] overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[#f5f5f5] shadow-lg lg:aspect-square">
            <img src={SPLIT_IMAGE} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="absolute -bottom-6 -start-6 hidden max-w-xs rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-xl sm:block">
            <p className="text-2xl font-bold text-[#141414]">100%</p>
            <p className="mt-1 text-xs text-[#888888]">شفافية في البيانات المعروضة للوحدة</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
