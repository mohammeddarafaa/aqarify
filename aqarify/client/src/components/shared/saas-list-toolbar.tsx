import type { ReactNode } from "react";
import { Search } from "lucide-react";
import {
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui-kit";

interface Option {
  value: string;
  label: string;
}

interface SaaSListToolbarProps {
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  filterLabel?: string;
  filterValue?: string;
  filterOptions?: Option[];
  onFilterChange?: (value: string) => void;
  actionLabel?: string;
  onActionClick?: () => void;
  actionDisabled?: boolean;
  customAction?: ReactNode;
}

export function SaaSListToolbar({
  searchValue = "",
  searchPlaceholder = "Search...",
  onSearchChange,
  filterLabel,
  filterValue,
  filterOptions,
  onFilterChange,
  actionLabel,
  onActionClick,
  actionDisabled,
  customAction,
}: SaaSListToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {onSearchChange ? (
        <div className="relative min-w-[220px] flex-1 md:max-w-sm">
          <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pe-9"
          />
        </div>
      ) : null}
      {filterOptions && onFilterChange ? (
        <div className="flex items-center gap-2">
          {filterLabel ? <span className="text-xs text-muted-foreground">{filterLabel}</span> : null}
          <Select value={filterValue} onValueChange={onFilterChange}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      {customAction}
      {actionLabel && onActionClick ? (
        <Button onClick={onActionClick} disabled={actionDisabled}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
