import { ORDER_NUMBER_PATTERN } from "@/api/dto";

/**
 * Payment return parsing.
 *
 * The return link carries navigation data only. No token, amount, currency, or
 * provider transaction payload is read here, and nothing derived from it may be
 * treated as proof of payment.
 */
export type PaymentReturn = {
  orderNumber: string;
  /** Navigation outcome hint only; never authoritative. */
  outcome: "returned" | "cancelled" | "unknown";
};

export function parsePaymentReturn(
  url: string | null | undefined,
): PaymentReturn | null {
  if (!url) return null;

  const queryIndex = url.indexOf("?");
  if (queryIndex === -1) return null;
  const search = new URLSearchParams(url.slice(queryIndex + 1));

  const orderNumber = search.get("orderNumber") ?? search.get("order") ?? "";
  if (!ORDER_NUMBER_PATTERN.test(orderNumber)) return null;

  const rawOutcome = (search.get("outcome") ?? "").toLowerCase();
  const outcome: PaymentReturn["outcome"] =
    rawOutcome === "cancelled"
      ? "cancelled"
      : rawOutcome === ""
        ? "returned"
        : "unknown";

  return { orderNumber, outcome };
}

/** A hosted Paystack checkout URL is always an absolute HTTPS URL. */
export function isValidAuthorizationUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}
