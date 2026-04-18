/** Product flow uses pending → confirmed | cancelled | expired. Legacy DB value `rejected` is unused. */
export interface Reservation {
  id: string;
  unit_id: string;
  customer_id: string;
  status: "pending" | "confirmed" | "cancelled" | "expired";
  total_price: number;
  reservation_fee_paid: number;
  payment_method: string;
  confirmation_number?: string;
  paymob_transaction_id?: string;
  confirmed_at?: string;
  notes?: string;
  created_at: string;
}

export interface ReservationBankDetails {
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
}

export type ReservationWithDetails = Reservation & {
  bank_details?: ReservationBankDetails | null;
};

export interface CheckoutFormData {
  full_name: string;
  email: string;
  phone: string;
  payment_method: "card" | "fawry" | "vodafone_cash" | "bank_transfer";
  notes?: string;
}
