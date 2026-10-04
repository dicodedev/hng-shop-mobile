const ngnFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatNgn(amountKobo: number): string {
  if (!Number.isSafeInteger(amountKobo) || amountKobo < 0) {
    throw new Error("Money must be a non-negative safe integer in kobo.");
  }

  return ngnFormatter
    .format(amountKobo / 100)
    .replace("NGN", "₦")
    .replace(/\s/g, "");
}
