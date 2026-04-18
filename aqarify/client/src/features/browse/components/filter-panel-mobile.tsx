import { motion, AnimatePresence } from "motion/react";
import { X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTenantStore } from "@/stores/tenant.store";
import type { BrowseFilters } from "@/features/browse/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  filters: BrowseFilters;
  onFilterChange: (key: string, value: string) => void;
  onClear: () => void;
}

export function FilterPanelMobile({ isOpen, onClose, filters, onFilterChange, onClear }: Props) {
  const tenant = useTenantStore((s) => s.tenant);
  const schema = tenant?.filter_schema;
  const [openKey, setOpenKey] = useState<string | null>(null);

  const dropdownFilters = schema?.filters.filter((f) => f.type === "dropdown" && f.options) ?? [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="filter-panel-mobile md:hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                <rect y="0" width="18" height="1.5" fill="white" />
                <rect y="6" width="12" height="1.5" fill="white" />
                <rect y="12" width="18" height="1.5" fill="white" />
              </svg>
              <span className="text-[11px] font-medium tracking-[0.18em] uppercase text-white">
                فلاتر الوحدات
              </span>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Filter sections */}
          <div className="flex-1 overflow-y-auto">
            {dropdownFilters.map((f) => (
              <div key={f.key} className="border-b border-white/10">
                <button
                  onClick={() => setOpenKey(openKey === f.key ? null : f.key)}
                  className="w-full flex items-center justify-between py-5 text-[11px] font-medium tracking-[0.15em] uppercase text-white/70 hover:text-white transition-colors">
                  <span>{filters[f.key] && filters[f.key] !== "all" ? filters[f.key] : f.label}</span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", openKey === f.key && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {openKey === f.key && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden">
                      <div className="pb-4 space-y-1">
                        <button
                          onClick={() => { onFilterChange(f.key, "all"); }}
                          className={cn("w-full text-start py-2.5 text-[11px] font-medium tracking-widest uppercase transition-colors",
                            (!filters[f.key] || filters[f.key] === "all") ? "text-white" : "text-white/40 hover:text-white/70")}>
                          الكل
                        </button>
                        {f.options!.map((opt) => (
                          <button key={opt}
                            onClick={() => { onFilterChange(f.key, opt); }}
                            className={cn("w-full text-start py-2.5 text-[11px] font-medium tracking-widest uppercase transition-colors",
                              filters[f.key] === opt ? "text-white" : "text-white/40 hover:text-white/70")}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {/* Search */}
            {schema?.has_search && (
              <div className="border-b border-white/10 py-5">
                <Input
                  type="text"
                  value={filters.search ?? ""}
                  onChange={(e) => onFilterChange("search", e.target.value)}
                  placeholder="SEARCH..."
                  className="bg-transparent text-white placeholder:text-white/30 border-white/20 rounded-full"
                />
              </div>
            )}
          </div>

          {/* Apply / Clear */}
          <div className="pt-8 flex gap-4 mt-auto">
            <Button
              variant="outline"
              onClick={() => { onClear(); onClose(); }}
              className="flex-1 text-white text-[11px] font-medium tracking-widest uppercase py-5 rounded-full border-white/20 bg-transparent hover:bg-transparent hover:border-white/50">
              مسح الكل
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-white text-[#141414] text-[11px] font-medium tracking-widest uppercase py-5 rounded-full hover:bg-white/90">
              عرض النتائج
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
