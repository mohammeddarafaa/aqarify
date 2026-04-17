import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const [local, setLocal] = useState(value);
  const debounced = useDebounce(local, 300);
  const { t } = useTranslation();

  useEffect(() => { onChange(debounced); }, [debounced, onChange]);
  useEffect(() => { setLocal(value); }, [value]);

  return (
    <div className="relative flex-1 min-w-48">
      <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
      <Input value={local} onChange={(e) => setLocal(e.target.value)}
        placeholder={t("actions.search") + "..."}
        className="ps-9 h-9 text-sm" />
    </div>
  );
}
