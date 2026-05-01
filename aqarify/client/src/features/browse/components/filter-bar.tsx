import type React from "react";
import { memo, useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  Banknote,
  Building2,
  RotateCcw,
  SlidersHorizontal,
  Waves,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { BrowseFilters } from "@/features/browse/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PriceRangeSlider } from "@/components/shared/price-range-slider";

interface FilterBarProps {
  filters: BrowseFilters;
  /** Single URLSearchParams update so rapid filter commits do not overwrite each other. */
  onFiltersPatch: (patch: Record<string, string>) => void;
  onClear: () => void;
  hasActive: boolean;
}

const MIN_PRICE = 300;
const MAX_PRICE = 50_000_000;

const filterCategories = [
  { id: "all", labelKey: "filters.title", icon: SlidersHorizontal },
  { id: "property", labelKey: "filters.type", icon: Building2 },
  { id: "price", labelKey: "filters.price_range", icon: Banknote },
  { id: "beds", labelKey: "filters.bedrooms_bathrooms", icon: BedDouble },
  { id: "amenities", labelKey: "filters.amenities", icon: Waves },
] as const;

const roomOptions = [
  { label: "Any", value: "all" },
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "4+", value: "4" },
];
const propertyTypes = [
  "Apartment",
  "Villa",
  "Townhouse",
  "Penthouse",
  "Compound",
  "Chalet",
  "Twin House",
  "Duplex",
  "Full Floor",
  "Half Floor",
  "Whole Building",
  "Land",
  "Bungalow",
  "Hotel Apartment",
  "iVilla",
];
const amenities = [
  "Pool",
  "Gym",
  "Parking",
  "Balcony",
  "Garden",
  "Security",
  "Elevator",
  "Pet Friendly",
  "Central AC",
  "Maid Room",
  "Study Room",
  "Storage Room",
];

const parseCsv = (value?: string) =>
  value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

export function FilterBar({ filters, onFiltersPatch, onClear, hasActive }: FilterBarProps) {
  const { t } = useTranslation("browse");
  const [selectedBeds, setSelectedBeds] = useState<string[]>(() => parseCsv(filters.bedrooms));
  const [selectedBaths, setSelectedBaths] = useState<string[]>(() => parseCsv(filters.bathrooms));
  const [priceRange, setPriceRange] = useState<[number, number]>(() => [
    Number(filters.min_price || MIN_PRICE),
    Number(filters.max_price || MAX_PRICE),
  ]);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>(() =>
    parseCsv(filters.type)
  );
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(() =>
    parseCsv(filters.amenities)
  );
  const isRtl = typeof document !== "undefined" && document.documentElement.dir === "rtl";

  useEffect(() => {
    setSelectedBeds(parseCsv(filters.bedrooms));
    setSelectedBaths(parseCsv(filters.bathrooms));
    setSelectedPropertyTypes(parseCsv(filters.type));
    setSelectedAmenities(parseCsv(filters.amenities));
    setPriceRange([Number(filters.min_price || MIN_PRICE), Number(filters.max_price || MAX_PRICE)]);
  }, [
    filters.bedrooms,
    filters.bathrooms,
    filters.type,
    filters.amenities,
    filters.min_price,
    filters.max_price,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onFiltersPatch({
        bedrooms: selectedBeds.join(","),
        bathrooms: selectedBaths.join(","),
        type: selectedPropertyTypes.join(","),
        amenities: selectedAmenities.join(","),
        min_price: priceRange[0] > MIN_PRICE ? String(priceRange[0]) : "",
        max_price: priceRange[1] < MAX_PRICE ? String(priceRange[1]) : "",
      });
    }, 380);
    return () => window.clearTimeout(timer);
  }, [selectedBeds, selectedBaths, selectedPropertyTypes, selectedAmenities, priceRange, onFiltersPatch]);

  const clearAllLocal = () => {
    setSelectedBeds([]);
    setSelectedBaths([]);
    setSelectedPropertyTypes([]);
    setSelectedAmenities([]);
    setPriceRange([MIN_PRICE, MAX_PRICE]);
    onClear();
  };

  const activeFiltersCount = useMemo(
    () =>
      selectedBeds.length +
      selectedBaths.length +
      selectedPropertyTypes.length +
      selectedAmenities.length +
      (priceRange[0] > MIN_PRICE || priceRange[1] < MAX_PRICE ? 1 : 0),
    [selectedBeds, selectedBaths, selectedPropertyTypes, selectedAmenities, priceRange]
  );

  const getCategoryCount = (id: (typeof filterCategories)[number]["id"]) => {
    switch (id) {
      case "property":
        return selectedPropertyTypes.length;
      case "price":
        return priceRange[0] > MIN_PRICE || priceRange[1] < MAX_PRICE ? 1 : 0;
      case "beds":
        return selectedBeds.length + selectedBaths.length;
      case "amenities":
        return selectedAmenities.length;
      case "all":
        return activeFiltersCount;
      default:
        return 0;
    }
  };

  return (
    <div className="bg-background">
      <div className="relative">
        <div className="overflow-x-auto overflow-y-hidden">
          <div className="flex items-center gap-2 px-6 py-3 pe-16 md:pe-6">
            {filterCategories.map((filter) => {
              const IconComponent = filter.icon;
              const count = getCategoryCount(filter.id);
              const isActive = count > 0;
              const heading = t(filter.labelKey);

              return (
                <Sheet key={filter.id}>
                  <SheetTrigger asChild>
                    <button
                      type="button"
                      className={`h-12 shrink-0 rounded-xl border px-4 text-sm font-medium transition-colors duration-200 active:scale-[0.98] ${
                        isActive
                          ? "border-primary bg-primary text-primary-foreground opacity-100 hover:opacity-90"
                          : "border-border bg-background text-foreground hover:border-foreground hover:bg-muted"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        {heading}
                        {count > 0 ? (
                          <span className="ms-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-background text-xs font-bold text-foreground">
                            {count}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </SheetTrigger>

                  <SheetContent
                    side="right"
                    showCloseButton={false}
                    className="h-full w-[480px] max-w-[90vw] gap-0 bg-background p-0"
                  >
                    <SheetHeader className="border-b border-border px-6">
                      <div className="flex items-center justify-between">
                        <SheetClose asChild>
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-muted"
                          >
                            <X className="h-4 w-4 text-foreground" />
                          </button>
                        </SheetClose>
                        <SheetTitle className="text-base font-bold text-foreground">{heading}</SheetTitle>
                        <div className="w-8" />
                      </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6 [contain:layout]">
                      <MemoizedFilterContent
                        filterId={filter.id}
                        selectedBeds={selectedBeds}
                        setSelectedBeds={setSelectedBeds}
                        selectedBaths={selectedBaths}
                        setSelectedBaths={setSelectedBaths}
                        priceRange={priceRange}
                        setPriceRange={setPriceRange}
                        selectedPropertyTypes={selectedPropertyTypes}
                        setSelectedPropertyTypes={setSelectedPropertyTypes}
                        selectedAmenities={selectedAmenities}
                        setSelectedAmenities={setSelectedAmenities}
                      />
                    </div>

                    <SheetFooter className="border-t border-border px-6 py-4">
                      <div className="flex w-full items-center justify-between">
                        <button
                          type="button"
                          onClick={clearAllLocal}
                          className="flex items-center gap-1.5 text-base font-semibold text-foreground underline transition-colors hover:opacity-80"
                        >
                          <RotateCcw className="h-4 w-4" />
                          {t("filters.clear_all")}
                        </button>
                        <SheetClose asChild>
                          <Button className="h-12 rounded-full bg-foreground px-8 text-base font-semibold text-background hover:bg-foreground/90">
                            {t("filters.show_results")}
                          </Button>
                        </SheetClose>
                      </div>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              );
            })}
            {hasActive ? (
              <button
                type="button"
                onClick={clearAllLocal}
                className="ms-2 text-xs font-medium uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("filters.reset")}
              </button>
            ) : null}
          </div>
        </div>
        <div
          className={`pointer-events-none absolute end-0 top-0 bottom-0 w-16 md:hidden ${
            isRtl ? "bg-gradient-to-r" : "bg-gradient-to-l"
          } from-background to-transparent`}
        />
      </div>
    </div>
  );
}

interface FilterContentProps {
  filterId: (typeof filterCategories)[number]["id"];
  selectedBeds: string[];
  setSelectedBeds: React.Dispatch<React.SetStateAction<string[]>>;
  selectedBaths: string[];
  setSelectedBaths: React.Dispatch<React.SetStateAction<string[]>>;
  priceRange: [number, number];
  setPriceRange: React.Dispatch<React.SetStateAction<[number, number]>>;
  selectedPropertyTypes: string[];
  setSelectedPropertyTypes: React.Dispatch<React.SetStateAction<string[]>>;
  selectedAmenities: string[];
  setSelectedAmenities: React.Dispatch<React.SetStateAction<string[]>>;
}

function FilterContent({
  filterId,
  selectedBeds,
  setSelectedBeds,
  selectedBaths,
  setSelectedBaths,
  priceRange,
  setPriceRange,
  selectedPropertyTypes,
  setSelectedPropertyTypes,
  selectedAmenities,
  setSelectedAmenities,
}: FilterContentProps) {
  const { t } = useTranslation("browse");

  const toggleArrayValue = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string
  ) => {
    setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const formatPrice = (value: number) => {
    if (value >= 1_000_000) return `${Number(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
    if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
    return value.toLocaleString();
  };

  const RoomSegment = ({
    title,
    selected,
    setter,
  }: {
    title: string;
    selected: string[];
    setter: React.Dispatch<React.SetStateAction<string[]>>;
  }) => (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="grid grid-cols-5 rounded-full bg-muted/65 p-1">
        {roomOptions.map((option) => {
          const active = option.value === "all" ? selected.length === 0 : selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                if (option.value === "all") setter([]);
                else setter([option.value]);
              }}
              className={cn(
                "h-11 rounded-full text-sm font-medium text-muted-foreground transition-all",
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

  const Pill = ({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-5 py-3 text-sm transition-all duration-200 ${
        isActive
          ? "bg-foreground font-semibold text-background"
          : "border border-border bg-muted/50 font-medium text-foreground hover:border-foreground"
      }`}
    >
      {label}
    </button>
  );

  const CheckRow = ({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) => (
    <label
      className="group flex w-full cursor-pointer items-center justify-between py-3 text-start"
    >
      <span className="text-base text-muted-foreground group-hover:text-foreground">{label}</span>
      <Switch checked={isActive} onCheckedChange={onClick} className="data-[state=checked]:bg-foreground" />
    </label>
  );

  const PriceSection = () => (
    <div className="space-y-6">
      <PriceRangeSlider
        value={priceRange}
        min={MIN_PRICE}
        max={MAX_PRICE}
        step={100000}
        avgLabel="Avg. price is 1.2M"
        formatValue={formatPrice}
        onValueChange={setPriceRange}
      />
    </div>
  );

  if (filterId === "all") {
    return (
      <div className="space-y-8">
        <div className="border-b border-border pb-8">
        <h3 className="mb-1 text-[22px] font-semibold text-foreground">{t("filters.type")}</h3>
          <p className="mb-4 text-sm text-muted-foreground">{t("filters.select_one_or_more")}</p>
          <div className="flex flex-wrap gap-2">
            {propertyTypes.map((propertyType) => (
              <Pill
                key={propertyType}
                label={propertyType}
                isActive={selectedPropertyTypes.includes(propertyType)}
                onClick={() => toggleArrayValue(setSelectedPropertyTypes, propertyType)}
              />
            ))}
          </div>
        </div>
        <div className="border-b border-border pb-8">
          <PriceSection />
        </div>
        <div className="border-b border-border pb-8">
          <RoomSegment title={t("filters.bedrooms")} selected={selectedBeds} setter={setSelectedBeds} />
          <div className="mt-6">
            <RoomSegment title={t("filters.bathrooms")} selected={selectedBaths} setter={setSelectedBaths} />
          </div>
        </div>
        <div>
          <h3 className="mb-4 text-[22px] font-semibold text-foreground">{t("filters.amenities")}</h3>
          <div>
            {amenities.map((amenity) => (
              <CheckRow
                key={amenity}
                label={amenity}
                isActive={selectedAmenities.includes(amenity)}
                onClick={() => toggleArrayValue(setSelectedAmenities, amenity)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (filterId === "property") {
    return (
      <div>
        <h3 className="mb-1 text-[22px] font-semibold text-foreground">{t("filters.type")}</h3>
        <p className="mb-6 text-sm text-muted-foreground">{t("filters.select_one_or_more")}</p>
        <div className="flex flex-wrap gap-2">
          {propertyTypes.map((propertyType) => (
            <Pill
              key={propertyType}
              label={propertyType}
              isActive={selectedPropertyTypes.includes(propertyType)}
              onClick={() => toggleArrayValue(setSelectedPropertyTypes, propertyType)}
            />
          ))}
        </div>
      </div>
    );
  }

  if (filterId === "price") return <PriceSection />;

  if (filterId === "beds") {
    return (
      <div className="space-y-8">
        <div>
          <RoomSegment title={t("filters.bedrooms")} selected={selectedBeds} setter={setSelectedBeds} />
        </div>
        <div>
          <RoomSegment title={t("filters.bathrooms")} selected={selectedBaths} setter={setSelectedBaths} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-4 text-[22px] font-semibold text-foreground">{t("filters.amenities")}</h3>
      <div>
        {amenities.map((amenity) => (
          <CheckRow
            key={amenity}
            label={amenity}
            isActive={selectedAmenities.includes(amenity)}
            onClick={() => toggleArrayValue(setSelectedAmenities, amenity)}
          />
        ))}
      </div>
    </div>
  );
}

const MemoizedFilterContent = memo(FilterContent);
