import {
  emailStateLabel,
  fulfillmentStateLabel,
  nextPollDecision,
  PAYMENT_POLL_DELAYS_MS,
  PAYMENT_POLL_WINDOW_MS,
  paymentStateLabel,
  phaseForPaymentState,
} from "@/features/payments/payment-state";
import {
  isValidAuthorizationUrl,
  parsePaymentReturn,
} from "@/features/payments/payment-return";

describe("nextPollDecision", () => {
  it("stops polling immediately for terminal states", () => {
    for (const state of ["paid", "failed", "refunded"] as const) {
      expect(nextPollDecision(state, 0)).toEqual({
        shouldPoll: false,
        delayMs: 0,
        exhausted: false,
      });
    }
  });

  it("caps each individual delay below the total polling window", () => {
    const decision = nextPollDecision("awaiting_payment", 0);
    expect(decision.shouldPoll).toBe(true);
    expect(decision.delayMs).toBe(PAYMENT_POLL_DELAYS_MS[0]);
    for (const delay of PAYMENT_POLL_DELAYS_MS) {
      expect(delay).toBeLessThanOrEqual(PAYMENT_POLL_WINDOW_MS);
    }
  });

  it("increases delays monotonically", () => {
    const delays = PAYMENT_POLL_DELAYS_MS.map(
      (_, attempt) => nextPollDecision("awaiting_payment", attempt).delayMs,
    );
    const sorted = [...delays].sort((a, b) => a - b);
    expect(delays).toEqual(sorted);
  });

  it("exhausts the bounded window instead of polling forever", () => {
    const decision = nextPollDecision(
      "awaiting_payment",
      PAYMENT_POLL_DELAYS_MS.length,
    );
    expect(decision).toEqual({
      shouldPoll: false,
      delayMs: 0,
      exhausted: true,
    });
  });

  it("keeps the overall polling window bounded", () => {
    const total = PAYMENT_POLL_DELAYS_MS.reduce((sum, delay) => sum + delay, 0);
    expect(total).toBeLessThanOrEqual(PAYMENT_POLL_WINDOW_MS * 2);
    expect(PAYMENT_POLL_WINDOW_MS).toBeLessThanOrEqual(120_000);
  });
});

describe("phaseForPaymentState", () => {
  it("maps persisted state to a screen phase", () => {
    expect(phaseForPaymentState("paid")).toBe("paid");
    expect(phaseForPaymentState("failed")).toBe("failed");
    expect(phaseForPaymentState("refunded")).toBe("recoverable_error");
    expect(phaseForPaymentState("awaiting_payment")).toBe("pending");
  });
});

describe("status labels", () => {
  it("always provides text so colour is never the only signal", () => {
    expect(paymentStateLabel("awaiting_payment")).toBe("Awaiting payment");
    expect(paymentStateLabel("paid")).toBe("Paid");
    expect(paymentStateLabel("failed")).toBe("Payment failed");
    expect(paymentStateLabel("refunded")).toBe("Refunded");
    expect(fulfillmentStateLabel("unfulfilled")).toBe("Not yet fulfilled");
    expect(fulfillmentStateLabel("delivered")).toBe("Delivered");
  });

  it("separates email state from payment state", () => {
    expect(emailStateLabel("sent")).toBe("Confirmation email sent.");
    expect(emailStateLabel("failed")).toContain("could not be sent");
    expect(emailStateLabel(null)).toBeNull();
  });
});

describe("parsePaymentReturn", () => {
  it("reads the order number for navigation only", () => {
    expect(
      parsePaymentReturn(
        "hngshop-dev://payment/result?orderNumber=HNG-2026-ABCD1234",
      ),
    ).toEqual({
      orderNumber: "HNG-2026-ABCD1234",
      outcome: "returned",
    });
  });

  it("recognises a cancellation hint without treating it as a failure", () => {
    expect(
      parsePaymentReturn(
        "https://shop.example.com/app/payment-result?orderNumber=HNG-2026-ABCD1234&outcome=cancelled",
      ),
    ).toEqual({ orderNumber: "HNG-2026-ABCD1234", outcome: "cancelled" });
  });

  it("rejects links without a valid order number", () => {
    expect(
      parsePaymentReturn(
        "hngshop-dev://payment/result?orderNumber=../../admin",
      ),
    ).toBeNull();
    expect(parsePaymentReturn("hngshop-dev://payment/result")).toBeNull();
    expect(
      parsePaymentReturn("hngshop-dev://payment/result?orderNumber=HNG-26-AB"),
    ).toBeNull();
    expect(parsePaymentReturn(null)).toBeNull();
    expect(parsePaymentReturn(undefined)).toBeNull();
  });

  it("ignores any payment claim carried in the link", () => {
    const result = parsePaymentReturn(
      "hngshop-dev://payment/result?orderNumber=HNG-2026-ABCD1234&status=paid&amount=999999",
    );
    expect(result).toEqual({
      orderNumber: "HNG-2026-ABCD1234",
      outcome: "returned",
    });
    expect(result && "status" in result).toBe(false);
  });
});

describe("isValidAuthorizationUrl", () => {
  it("accepts only absolute HTTPS provider URLs", () => {
    expect(isValidAuthorizationUrl("https://checkout.paystack.com/abc")).toBe(
      true,
    );
    expect(isValidAuthorizationUrl("http://checkout.paystack.com/abc")).toBe(
      false,
    );
    expect(isValidAuthorizationUrl("/relative")).toBe(false);
    expect(isValidAuthorizationUrl("not a url")).toBe(false);
  });
});
