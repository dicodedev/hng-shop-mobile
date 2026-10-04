import { z } from "zod";

import { moneySchema, pageMetaSchema } from "@/api/dto";

/**
 * Catalogue DTOs.
 *
 * These ignore unknown members rather than rejecting them; domain invariants the
 * backend must never violate (NGN only, integer kobo, UUIDs, absolute URLs)
 * remain strict.
 */
export const productSchema = z.object({
  id: z.uuid(),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  imageUrl: z.url(),
  price: moneySchema,
});

export const productPageSchema = z.object({
  data: z.array(productSchema),
  page: pageMetaSchema,
});

export type Product = z.infer<typeof productSchema>;
export type ProductPage = z.infer<typeof productPageSchema>;
