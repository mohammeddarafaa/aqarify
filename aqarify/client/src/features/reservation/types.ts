export interface Reservation {
  id: string;
  unit_id: string;
  customer_id: string;
  status: "pending" | "confirmed" | "cancelled" | "rejected";
  total_price: number;
  reservation_fee_paid: number;
  payment_method: string;
  paymob_transaction_id?: string;
  confirmed_at?: string;
  notes?: string;
  created_at: string;
}

export interface CheckoutFormData {
  full_name: string;
  email: string;
  phone: string;
  payment_method: "card" | "fawry" | "vodafone_cash" | "bank_transfer";
  notes?: string;
}
