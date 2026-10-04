import { formatNgn } from "@/lib/money";

describe("formatNgn", () => {
  it("formats integer kobo as Nigerian naira", () => {
    expect(formatNgn(2_850_000)).toBe("₦28,500");
    expect(formatNgn(1_250_050)).toBe("₦12,500.5");
  });

  it.each([-1, 1.2, Number.MAX_SAFE_INTEGER + 1])(
    "rejects an invalid kobo value: %s",
    (amount) => {
      expect(() => formatNgn(amount)).toThrow(
        "Money must be a non-negative safe integer in kobo.",
      );
    },
  );
});
