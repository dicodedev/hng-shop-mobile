import { z } from "zod";

/**
 * Success DTO schemas.
 *
 * These intentionally ignore unknown members rather than rejecting them:
 * `docs/API_CONTRACT.md` allows additive optional fields within version 1 and
 * requires clients to ignore unknown response fields. Domain invariants that the
 * backend must never violate (NGN only, integer kobo, UUIDs, absolute URLs)
 * remain strict.
 */
export const moneySchema = z.object({
  currency: z.literal("NGN"),
  amountKobo: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
});

export const productSchema = z.object({
  id: z.uuid(),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  imageUrl: z.url(),
  price: moneySchema,
});

export const pageMetaSchema = z.object({
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export const productPageSchema = z.object({
  data: z.array(productSchema),
  page: pageMetaSchema,
});

export type Money = z.infer<typeof moneySchema>;
export type Product = z.infer<typeof productSchema>;
export type ProductPage = z.infer<typeof productPageSchema>;
