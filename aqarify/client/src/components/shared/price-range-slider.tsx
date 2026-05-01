import * as Slider from "@radix-ui/react-slider";

interface PriceRangeSliderProps {
  value: [number, number];
  min?: number;
  max?: number;
  step?: number;
  avgLabel?: string;
  formatValue?: (value: number) => string;
  onValueChange?: (value: [number, number]) => void;
}

const histogramBars = [
  26, 44, 34, 52, 30, 38, 62, 48, 66, 72, 56, 78, 86, 74, 88, 70, 82, 64, 58,
  76, 68, 54, 50, 46, 63, 74, 58, 70, 51, 42, 36, 48, 31, 44, 26,
];

function compactCurrency(value: number) {
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return value.toLocaleString();
}

export function PriceRangeSlider({
  value,
  min = 0,
  max = 10000000,
  step = 10000,
  avgLabel,
  formatValue = compactCurrency,
  onValueChange,
}: PriceRangeSliderProps) {
  const span = Math.max(1, max - min);
  const minPct = ((value[0] - min) / span) * 100;
  const maxPct = ((value[1] - min) / span) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">Price range</p>
        {avgLabel ? <p className="text-xs text-muted-foreground">{avgLabel}</p> : null}
      </div>

      <div className="relative pb-8">
        <div className="flex h-24 items-end gap-1">
          {histogramBars.map((height, index) => {
            const ratio = (index / (histogramBars.length - 1)) * 100;
            const active = ratio >= minPct && ratio <= maxPct;

            return (
              <span
                key={index}
                className={active ? "flex-1 rounded-full bg-foreground" : "flex-1 rounded-full bg-muted"}
                style={{ height: `${height}%`, minWidth: 3 }}
              />
            );
          })}
        </div>

        <Slider.Root
          min={min}
          max={max}
          step={step}
          value={value}
          onValueChange={(next) => onValueChange?.([next[0] ?? min, next[1] ?? max])}
          className="absolute inset-x-5 bottom-8 flex h-5 touch-none select-none items-center"
        >
          <Slider.Track className="relative h-3 grow rounded-full bg-muted shadow-inner">
            <Slider.Range className="absolute h-full rounded-full bg-background shadow-[0_6px_20px_rgb(20_20_20/.16)]" />
          </Slider.Track>
          <Slider.Thumb className="block h-3 w-3 rounded-full border border-foreground bg-foreground shadow outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
          <Slider.Thumb className="block h-3 w-3 rounded-full border border-foreground bg-foreground shadow outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
        </Slider.Root>

        <span
          className="absolute bottom-0 z-10 -translate-x-1/2 rounded-full bg-foreground px-2.5 py-1 text-[11px] font-semibold text-background shadow-lg"
          style={{ left: `${Math.max(7, Math.min(93, minPct))}%` }}
        >
          {formatValue(value[0])}
        </span>
        <span
          className="absolute bottom-0 z-10 -translate-x-1/2 rounded-full bg-foreground px-2.5 py-1 text-[11px] font-semibold text-background shadow-lg"
          style={{ left: `${Math.max(7, Math.min(93, maxPct))}%` }}
        >
          {formatValue(value[1])}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
}
