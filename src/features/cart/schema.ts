import { z } from "zod";

/**
 * Canonical account cart DTO.
 *
 * `cart_items` persists product IDs and quantities only; product fields are
 * joined at read time. Joined prices are display snapshots and are never
 * authoritative for checkout pricing.
 */
export const cartItemSchema = z.object({
  id: z.uuid(),
  slug: z.string().min(1),
  name: z.string().min(1),
  imageUrl: z.url(),
  priceAmount: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  currency: z.literal("NGN"),
  quantity: z.number().int().min(1).max(99),
  available: z.boolean(),
  version: z.number().int().min(1),
});

export const cartSchema = z.object({
  items: z.array(cartItemSchema).max(50),
  updatedAt: z.string().min(1),
  version: z.number().int().nonnegative(),
});

export type CartItem = z.infer<typeof cartItemSchema>;
export type Cart = z.infer<typeof cartSchema>;

export const MAX_CART_LINES = 50;
export const MAX_ITEM_QUANTITY = 99;

export function cartItemCount(cart: Cart | null | undefined): number {
  return cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;
}

/** Display-only subtotal in integer kobo. Server reprices at checkout. */
export function cartSubtotalKobo(cart: Cart | null | undefined): number {
  return (
    cart?.items.reduce(
      (total, item) => total + item.priceAmount * item.quantity,
      0,
    ) ?? 0
  );
}

export function hasUnavailableItems(cart: Cart | null | undefined): boolean {
  return cart?.items.some((item) => !item.available) ?? false;
}
