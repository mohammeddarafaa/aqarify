import * as React from "react";
import { cn } from "@/lib/utils";
import { NativeBadge } from "@/components/uitripled/native-badge-carbon";

type LegacyVariant = "default" | "secondary" | "destructive" | "outline";

export interface TripledBadgeProps extends React.ComponentProps<typeof NativeBadge> {
  variant?: LegacyVariant;
}

function mapVariant(variant?: LegacyVariant) {
  if (variant === "outline") return "outline";
  if (variant === "destructive") return "glow";
  if (variant === "secondary") return "neutral";
  return "default";
}

export function TripledBadge({ className, variant = "default", ...props }: TripledBadgeProps) {
  return (
    <NativeBadge
      variant={mapVariant(variant)}
      className={cn("rounded-md", className)}
      {...props}
    />
  );
}
