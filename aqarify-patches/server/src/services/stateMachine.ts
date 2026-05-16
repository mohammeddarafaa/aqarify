/**
 * T3-F — Payment & Reservation State Machine
 *
 * Enforces valid status transitions before any DB write so no status
 * can move backward or skip steps (Constitution §2).
 *
 * Call assertReservationTransition / assertPaymentTransition before any
 * status update in reservation.service.ts, webhooks.routes.ts, agent.routes.ts.
 */

export class InvalidTransitionError extends Error {
  readonly code = "INVALID_TRANSITION";
  readonly from: string;
  readonly to: string;

  constructor(entity: string, from: string, to: string) {
    super(`Invalid ${entity} transition: ${from} → ${to}`);
    this.from = from;
    this.to = to;
  }
}

// ─── Reservation state machine ────────────────────────────────────────────────
//
// pending ──► confirmed
// pending ──► cancelled
// pending ──► expired
// confirmed ──► cancelled   (manager refund flow)
// All other transitions are rejected.
//
const RESERVATION_TRANSITIONS: Record<string, readonly string[]> = {
  pending:   ["confirmed", "cancelled", "expired"],
  confirmed: ["cancelled"],   // refund/manager override only
  cancelled: [],              // terminal
  expired:   [],              // terminal
  rejected:  [],              // legacy terminal
};

export function assertReservationTransition(from: string, to: string): void {
  const allowed = RESERVATION_TRANSITIONS[from];
  if (!allowed) {
    throw new InvalidTransitionError("reservation", from, to);
  }
  if (!allowed.includes(to)) {
    throw new InvalidTransitionError("reservation", from, to);
  }
}

// ─── Payment state machine ────────────────────────────────────────────────────
//
// pending ──► paid
// pending ──► overdue
// pending ──► failed
// overdue ──► paid
// overdue ──► failed
// All other transitions are rejected.
//
const PAYMENT_TRANSITIONS: Record<string, readonly string[]> = {
  pending: ["paid", "overdue", "failed"],
  overdue: ["paid", "failed"],
  paid:    [],    // terminal
  failed:  [],    // terminal
};

export function assertPaymentTransition(from: string, to: string): void {
  const allowed = PAYMENT_TRANSITIONS[from];
  if (!allowed) {
    throw new InvalidTransitionError("payment", from, to);
  }
  if (!allowed.includes(to)) {
    throw new InvalidTransitionError("payment", from, to);
  }
}
