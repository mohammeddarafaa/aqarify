import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { type CheckoutFormData, type Reservation } from "../types";

export function useMyReservations() {
  return useQuery<Reservation[]>({
    queryKey: ["my-reservations"],
    queryFn: async () => {
      const res = await api.get("/reservations");
      return res.data.data;
    },
  });
}

export function useReservation(id: string) {
  return useQuery<Reservation & { units: Record<string, unknown>; payments?: unknown[] }>({
    queryKey: ["reservation", id],
    queryFn: async () => {
      const res = await api.get(`/reservations/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateReservation() {
  return useMutation({
    mutationFn: async (payload: { unit_id: string } & CheckoutFormData) => {
      const res = await api.post("/reservations", payload);
      return res.data.data as {
        reservation: Reservation;
        payment_key: string | null;
        iframe_id: string | null;
        method: string;
      };
    },
  });
}
