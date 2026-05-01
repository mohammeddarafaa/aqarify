import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PeriodSelectorProps {
  value: "daily" | "weekly" | "monthly";
  onValueChange: (value: "daily" | "weekly" | "monthly") => void;
}

export function PeriodSelector({ value, onValueChange }: PeriodSelectorProps) {
  return (
    <Select value={value} onValueChange={(next) => onValueChange(next as "daily" | "weekly" | "monthly")}>
      <SelectTrigger className="h-12 w-[132px] rounded-full border-transparent bg-card/75 px-5 shadow-none">
        <SelectValue placeholder="Period" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="monthly">Monthly</SelectItem>
        <SelectItem value="weekly">Weekly</SelectItem>
        <SelectItem value="daily">Daily</SelectItem>
      </SelectContent>
    </Select>
  );
}
