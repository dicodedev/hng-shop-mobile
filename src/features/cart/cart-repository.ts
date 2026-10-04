import { apiClient } from "@/api/client";
import { InvalidApiResponseError } from "@/api/errors";
import { cartSchema, type Cart } from "@/features/cart/schema";

/**
 * Cart repository over the deployed bearer-compatible `/api/v1/cart` routes.
 *
 * The canonical cart is account-owned in Supabase and shared with the web
 * application. Nothing here is persisted to device storage.
 */
export interface CartRepository {
  getCart(token: string): Promise<Cart>;
  addItem(token: string, productId: string, quantity?: number): Promise<Cart>;
  setItemQuantity(
    token: string,
    productId: string,
    quantity: number,
  ): Promise<Cart>;
  removeItem(token: string, productId: string): Promise<Cart>;
  clearCart(token: string): Promise<Cart>;
}

function parseCart(body: unknown): Cart {
  const parsed = cartSchema.safeParse(body);
  if (!parsed.success) {
    throw new InvalidApiResponseError(
      "The cart response did not match the contract.",
      {
        cause: parsed.error,
      },
    );
  }
  return parsed.data;
}

export const httpCartRepository: CartRepository = {
  async getCart(token) {
    return parseCart(await apiClient.getJson("/cart", { token }));
  },

  async addItem(token, productId, quantity) {
    return parseCart(
      await apiClient.request("/cart/items", {
        method: "POST",
        token,
        body: { productId, ...(quantity === undefined ? {} : { quantity }) },
      }),
    );
  },

  async setItemQuantity(token, productId, quantity) {
    return parseCart(
      await apiClient.request(`/cart/items/${encodeURIComponent(productId)}`, {
        method: "PATCH",
        token,
        body: { quantity },
      }),
    );
  },

  async removeItem(token, productId) {
    return parseCart(
      await apiClient.request(`/cart/items/${encodeURIComponent(productId)}`, {
        method: "DELETE",
        token,
      }),
    );
  },

  async clearCart(token) {
    return parseCart(
      await apiClient.request("/cart", { method: "DELETE", token }),
    );
  },
};
