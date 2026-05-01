export type ReservationStatus = "pending" | "confirmed" | "cancelled" | "expired";

export const RESERVATION_STATUS_OPTIONS: Array<{ value: "all" | ReservationStatus; label: string }> = [
  { value: "all", label: "الكل" },
  { value: "pending", label: "معلق" },
  { value: "confirmed", label: "مؤكد" },
  { value: "cancelled", label: "ملغي" },
  { value: "expired", label: "منتهي" },
];

export const RESERVATION_STATUS_VARIANT: Record<
  ReservationStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  confirmed: "default",
  cancelled: "destructive",
  expired: "outline",
};

export function getReservationStatusLabel(status: string) {
  return RESERVATION_STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
}

export function getReservationStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "pending") return RESERVATION_STATUS_VARIANT.pending;
  if (status === "confirmed") return RESERVATION_STATUS_VARIANT.confirmed;
  if (status === "cancelled") return RESERVATION_STATUS_VARIANT.cancelled;
  if (status === "expired") return RESERVATION_STATUS_VARIANT.expired;
  return "outline";
}
