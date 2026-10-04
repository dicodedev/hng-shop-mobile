import { z } from "zod";

/**
 * Shared response primitives from `docs/api/openapi.yaml`.
 *
 * Unknown members are ignored on purpose: the contract permits additive
 * optional fields within version 1 and requires clients to ignore them.
 */
export const moneySchema = z.object({
  currency: z.literal("NGN"),
  amountKobo: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
});

export const pageMetaSchema = z.object({
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export const paymentStateSchema = z.enum([
  "awaiting_payment",
  "paid",
  "failed",
  "refunded",
]);

export const fulfillmentStateSchema = z.enum([
  "unfulfilled",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

export const emailStateSchema = z
  .enum(["pending", "sent", "failed"])
  .nullable();

/** `HNG-YYYY-XXXXXXXX` per the contract's order-number convention. */
export const ORDER_NUMBER_PATTERN = /^HNG-[0-9]{4}-[A-Z0-9]{4,20}$/;
export const orderNumberSchema = z.string().regex(ORDER_NUMBER_PATTERN);

export type Money = z.infer<typeof moneySchema>;
export type PaymentState = z.infer<typeof paymentStateSchema>;
export type FulfillmentState = z.infer<typeof fulfillmentStateSchema>;
export type EmailState = z.infer<typeof emailStateSchema>;
