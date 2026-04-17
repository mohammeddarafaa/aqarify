import { motion } from "motion/react";
import { LayoutGrid, Map } from "lucide-react";

interface ViewToggleProps {
  view: "grid" | "map";
  onChange: (v: "grid" | "map") => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div
      className="inline-flex items-center gap-1 p-1.5 border rounded-full"
      style={{ borderColor: "var(--color-border)", background: "white" }}
    >
      {(["grid", "map"] as const).map((v) => (
        <button key={v} onClick={() => onChange(v)}
          className="relative flex items-center gap-1.5 px-4 py-2 text-sm rounded-full transition-colors">
          {view === v && (
            <motion.div layoutId="view-indicator"
              className="absolute inset-0 rounded-full"
              style={{ background: "var(--color-foreground)" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }} />
          )}
          <span className="relative flex items-center gap-1.5" style={{ color: view === v ? "white" : "var(--color-foreground)" }}>
            {v === "grid" ? <LayoutGrid className="h-3.5 w-3.5" /> : <Map className="h-3.5 w-3.5" />}
            <span>{v === "grid" ? "List" : "Map"}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
