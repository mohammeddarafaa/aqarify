import { ChevronDown, X, Search } from "lucide-react";
import { useState, useRef } from "react";
import { useTenantStore } from "@/stores/tenant.store";
import type { BrowseFilters } from "@/features/browse/types";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  filters: BrowseFilters;
  onFilterChange: (key: string, value: string) => void;
  onClear: () => void;
  hasActive: boolean;
}

interface DropdownProps {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  isLast?: boolean;
}

function FilterDropdown({ label, options, value, onChange, isLast }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeLabel = value && value !== "all" ? value : null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "filter-select-trigger",
          !isLast && "border-e border-[var(--color-border)]",
          isLast && "border-none",
          open && "bg-[var(--color-muted)]"
        )}>
        <span className={cn("label-muted",
          activeLabel ? "text-foreground" : "text-muted-foreground")}>
          {activeLabel ?? label}
        </span>
        <ChevronDown className={cn("h-3 w-3 text-foreground transition-transform shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[90] bg-transparent"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full start-0 z-[100] mt-0.5 min-w-[180px] border border-[var(--color-border)] bg-white shadow-lg">
            <button
              onClick={() => { onChange("all"); setOpen(false); }}
              className={cn("w-full text-start px-4 py-3 text-xs font-medium tracking-widest uppercase hover:bg-[var(--color-muted)] transition-colors",
                (!value || value === "all") ? "text-foreground" : "text-muted-foreground")}>
              الكل
            </button>
            {options.map((opt) => (
              <button key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={cn("w-full text-start px-4 py-3 text-xs font-medium tracking-widest uppercase hover:bg-[var(--color-muted)] transition-colors",
                  value === opt ? "text-foreground" : "text-muted-foreground")}>
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function FilterBar({ filters, onFilterChange, onClear, hasActive }: FilterBarProps) {
  const tenant = useTenantStore((s) => s.tenant);
  const schema = tenant?.filter_schema;

  const dropdownFilters = schema?.filters.filter((f) => f.type === "dropdown" && f.options) ?? [];
  const bedroomOptions = ["1", "2", "3", "4"];
  const bathroomOptions = ["1", "2", "3", "4"];
  const chipClass = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-widest transition-colors",
      active
        ? "border-foreground bg-foreground text-background"
        : "border-[var(--color-border)] text-muted-foreground hover:border-foreground hover:text-foreground"
    );

  return (
    <div className="space-y-3 py-3">
      <div className="flex min-w-0 flex-wrap items-stretch overflow-visible sm:flex-nowrap">
      {/* Dynamic dropdown filters */}
      {dropdownFilters.map((f, i) => (
        <FilterDropdown
          key={f.key}
          label={f.label}
          options={f.options!}
          value={filters[f.key] ?? "all"}
          onChange={(v) => onFilterChange(f.key, v)}
          isLast={i === dropdownFilters.length - 1 && !schema?.has_search && !hasActive}
        />
      ))}

      {/* Search */}
      {schema?.has_search && (
        <div className="flex items-center flex-1 min-w-[180px] border-e border-[var(--color-border)] last:border-e-0">
          <input
            type="text"
            value={filters.search ?? ""}
            onChange={(e) => onFilterChange("search", e.target.value)}
            placeholder="بحث..."
            className="search-clean flex-1"
          />
          <Search className="h-3.5 w-3.5 text-muted-foreground me-4 shrink-0" />
        </div>
      )}

      {/* Clear */}
      {hasActive && (
        <button
          onClick={onClear}
          className="flex items-center gap-2 px-4 text-xs font-medium tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors shrink-0 border-e-0">
          مسح
          <div className="flex h-5 w-5 items-center justify-center rounded-full border border-muted-foreground">
            <X className="h-2.5 w-2.5" />
          </div>
        </button>
      )}
      </div>

      <div className="flex flex-wrap items-center gap-2 px-1">
        <span className="label-muted text-muted-foreground">beds</span>
        <button onClick={() => onFilterChange("bedrooms", "all")} className={chipClass(!filters.bedrooms)}>Any</button>
        {bedroomOptions.map((n) => (
          <button key={n} onClick={() => onFilterChange("bedrooms", n)} className={chipClass(filters.bedrooms === n)}>
            {n === "4" ? "4+" : n}
          </button>
        ))}

        <span className="ms-3 label-muted text-muted-foreground">baths</span>
        <button onClick={() => onFilterChange("bathrooms", "all")} className={chipClass(!filters.bathrooms)}>Any</button>
        {bathroomOptions.map((n) => (
          <button key={n} onClick={() => onFilterChange("bathrooms", n)} className={chipClass(filters.bathrooms === n)}>
            {n === "4" ? "4+" : n}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 px-1">
        <input
          type="number"
          min={0}
          value={filters.min_price ?? ""}
          onChange={(e) => onFilterChange("min_price", e.target.value)}
          placeholder="Min price"
          className="h-9 w-28 rounded-full border border-[var(--color-border)] px-3 text-xs outline-none focus:border-foreground"
        />
        <input
          type="number"
          min={0}
          value={filters.max_price ?? ""}
          onChange={(e) => onFilterChange("max_price", e.target.value)}
          placeholder="Max price"
          className="h-9 w-28 rounded-full border border-[var(--color-border)] px-3 text-xs outline-none focus:border-foreground"
        />
        <label className="ms-2 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          <input
            type="checkbox"
            checked={filters.fha_eligible === "true"}
            onChange={(e) => onFilterChange("fha_eligible", e.target.checked ? "true" : "all")}
            className="h-3.5 w-3.5 accent-[var(--color-primary)]"
          />
          FHA eligible only
        </label>
      </div>
    </div>
  );
}
