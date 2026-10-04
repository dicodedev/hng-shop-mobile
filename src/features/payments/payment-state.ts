import type { PaymentState } from "@/api/dto";

/**
 * Payment verification state machine.
 *
 * A browser return or deep link is navigation only. Success is rendered solely
 * after the authenticated API reports `paid`.
 */
export type PaymentPhase =
  | "idle"
  | "creating_session"
  | "opening_paystack"
  | "awaiting_return"
  | "verifying"
  | "paid"
  | "pending"
  | "failed"
  | "recoverable_error";

export const PAYMENT_POLL_DELAYS_MS = [
  1_000, 2_000, 4_000, 8_000, 15_000, 20_000,
] as const;

export const PAYMENT_POLL_WINDOW_MS = 60_000;

export type PollDecision = {
  shouldPoll: boolean;
  delayMs: number;
  /** Set when the bounded window is exhausted and manual recovery is offered. */
  exhausted: boolean;
};

/**
 * Decides whether to keep polling.
 *
 * Polling continues only while payment is unresolved and the bounded window has
 * not elapsed. Terminal states stop polling immediately.
 */
export function nextPollDecision(
  state: PaymentState,
  attempt: number,
): PollDecision {
  if (state === "paid" || state === "failed" || state === "refunded") {
    return { shouldPoll: false, delayMs: 0, exhausted: false };
  }

  if (attempt >= PAYMENT_POLL_DELAYS_MS.length) {
    return { shouldPoll: false, delayMs: 0, exhausted: true };
  }

  return {
    shouldPoll: true,
    delayMs: PAYMENT_POLL_DELAYS_MS[attempt] ?? 0,
    exhausted: false,
  };
}

export function phaseForPaymentState(state: PaymentState): PaymentPhase {
  switch (state) {
    case "paid":
      return "paid";
    case "failed":
      return "failed";
    case "refunded":
      return "recoverable_error";
    case "awaiting_payment":
      return "pending";
    default:
      return "pending";
  }
}

/**
 * Human wording for a payment state.
 *
 * Status is always expressed in text so colour is never the only signal.
 */
export function paymentStateLabel(state: PaymentState): string {
  switch (state) {
    case "awaiting_payment":
      return "Awaiting payment";
    case "paid":
      return "Paid";
    case "failed":
      return "Payment failed";
    case "refunded":
      return "Refunded";
    default:
      return "Awaiting payment";
  }
}

export function fulfillmentStateLabel(state: string): string {
  switch (state) {
    case "unfulfilled":
      return "Not yet fulfilled";
    case "processing":
      return "Being prepared";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default:
      return "Being prepared";
  }
}

export function emailStateLabel(state: string | null): string | null {
  switch (state) {
    case "pending":
      return "Confirmation email is being sent.";
    case "sent":
      return "Confirmation email sent.";
    case "failed":
      return "Payment is confirmed, but the confirmation email could not be sent.";
    default:
      return null;
  }
}
