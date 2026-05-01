import { cn } from "@/lib/utils";

interface FilterChipsProps {
  value?: string;
  options: { label: string; value: string }[];
  onValueChange?: (value: string) => void;
}

export function FilterChips({ value, options, onValueChange }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          onClick={() => onValueChange?.(option.value)}
          className={cn(
            "h-9 rounded-full border border-border px-3 text-xs transition-colors",
            option.value === value ? "border-lime bg-lime text-lime-foreground" : "bg-background text-foreground hover:bg-muted"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
