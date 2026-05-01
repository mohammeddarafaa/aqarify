import { RotateCcw, X } from "lucide-react";
import { Drawer } from "vaul";
import type { BrowseFilters } from "@/features/browse/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PriceRangeSlider } from "@/components/shared/price-range-slider";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  filters: BrowseFilters;
  onFilterChange: (key: string, value: string) => void;
  /** Sets min/max price atomically — avoids sequential setFilter overwriting the URL (same fix as desktop FilterBar). */
  onFiltersPatch: (patch: Record<string, string>) => void;
  onClear: () => void;
  resultCount?: number;
}

const MIN_PRICE = 300;
const MAX_PRICE = 50_000_000;
const roomOptions = [
  { label: "Any", value: "all" },
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "4+", value: "4" },
];

function compactPrice(value: number) {
  if (value >= 1_000_000) return `${Number(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return value.toLocaleString();
}

function SegmentedRoomControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
}) {
  const current = value && value !== "all" ? value : "all";

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="grid grid-cols-5 rounded-full bg-muted/65 p-1">
        {roomOptions.map((option) => {
          const active = current === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "h-11 rounded-full text-sm font-medium text-muted-foreground transition-all active:scale-[0.97]",
                active && "bg-background text-foreground shadow-[0_8px_22px_rgb(20_20_20/.16)]",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FilterPanelMobile({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onFiltersPatch,
  onClear,
  resultCount,
}: Props) {
  const priceRange: [number, number] = [
    Number(filters.min_price || MIN_PRICE),
    Number(filters.max_price || MAX_PRICE),
  ];

  const handleClear = () => {
    onClear();
  };

  return (
    <Drawer.Root
      open={isOpen}
      shouldScaleBackground={false}
      repositionInputs={false}
      modal
      dismissible
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm md:hidden" />
        <Drawer.Content className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 mx-auto flex max-h-[88svh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-border bg-background shadow-[0_28px_80px_rgb(20_20_20/.24)] outline-none md:hidden">
          <Drawer.Title className="sr-only">Unit filters</Drawer.Title>

          <div className="flex justify-center pt-3">
            <Drawer.Handle className="h-1 w-12 shrink-0 rounded-full bg-muted" />
          </div>

          <div className="flex items-center justify-between px-5 pb-2 pt-3">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Filters</h2>
            <Drawer.Close asChild>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full bg-muted/70 text-foreground transition-colors hover:bg-muted"
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </button>
            </Drawer.Close>
          </div>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 pb-5 pt-2 [touch-action:pan-y]">
            <SegmentedRoomControl
              label="Bedrooms"
              value={filters.bedrooms}
              onChange={(next) => onFilterChange("bedrooms", next)}
            />

            <SegmentedRoomControl
              label="Bathrooms"
              value={filters.bathrooms}
              onChange={(next) => onFilterChange("bathrooms", next)}
            />

            <PriceRangeSlider
              value={priceRange}
              min={MIN_PRICE}
              max={MAX_PRICE}
              step={100000}
              avgLabel="Avg. price is 1.2M"
              formatValue={compactPrice}
              onValueChange={(next) => {
                onFiltersPatch({
                  min_price: next[0] > MIN_PRICE ? String(next[0]) : "",
                  max_price: next[1] < MAX_PRICE ? String(next[1]) : "",
                });
              }}
            />

            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">More options</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Fine tune availability and layout</p>
                </div>
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-2 text-xs font-medium text-muted-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
              </div>

              <label className="flex items-center justify-between gap-4 text-base text-muted-foreground">
                FHA eligible only
                <Switch
                  checked={filters.fha_eligible === "true"}
                  onCheckedChange={(checked) => onFilterChange("fha_eligible", checked ? "true" : "all")}
                  className="h-8 w-14 data-[state=checked]:bg-foreground [&_[data-slot=switch-thumb]]:size-7 [&_[data-slot=switch-thumb]]:data-[state=checked]:translate-x-6"
                />
              </label>

              <label className="flex items-center justify-between gap-4 text-base text-muted-foreground">
                Single story only
                <Switch
                  checked={filters.single_story === "true"}
                  onCheckedChange={(checked) => onFilterChange("single_story", checked ? "true" : "all")}
                  className="h-8 w-14 data-[state=checked]:bg-foreground [&_[data-slot=switch-thumb]]:size-7 [&_[data-slot=switch-thumb]]:data-[state=checked]:translate-x-6"
                />
              </label>
            </div>
          </div>

          <div className="px-5 pb-5 pt-2">
            <Drawer.Close asChild>
              <Button className="h-14 w-full rounded-full bg-foreground text-base font-semibold text-background shadow-[0_10px_30px_rgb(20_20_20/.25)] hover:bg-foreground/90">
                Show {resultCount ?? 64} results
              </Button>
            </Drawer.Close>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
