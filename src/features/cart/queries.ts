import {
  onlineManager,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { useAuth } from "@/auth/session-provider";
import { httpCartRepository } from "@/features/cart/cart-repository";
import { MAX_ITEM_QUANTITY, type Cart } from "@/features/cart/schema";

export const cartKeys = {
  all: ["cart"] as const,
  detail: () => [...cartKeys.all, "detail"] as const,
};

export class CartMutationBlockedError extends Error {
  constructor(reason: "offline" | "unauthenticated") {
    super(
      reason === "offline"
        ? "Cart changes require a connection."
        : "Sign in to change your cart.",
    );
    this.name = "CartMutationBlockedError";
  }
}

/** Invalidates the canonical cart so the next read comes from the API. */
export function invalidateCart(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: cartKeys.detail() });
}

/**
 * Canonical cart read.
 *
 * Transient by design: there is intentionally no `meta.persist`, so cart
 * payloads never reach AsyncStorage. The account cart is refetched on mount,
 * reconnect, foreground, Realtime version change, and after verified payment.
 */
export function useCartQuery() {
  const { accessToken, status } = useAuth();

  return useQuery({
    queryKey: cartKeys.detail(),
    queryFn: ({ signal }) => {
      if (!accessToken) throw new CartMutationBlockedError("unauthenticated");
      return httpCartRepository.getCart(accessToken);
    },
    enabled: status === "authenticated" && Boolean(accessToken),
    staleTime: 0,
    retry: 1,
  });
}

type CartMutationVariables = { productId?: string; quantity?: number };

export function useCartMutations() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const online = onlineManager.isOnline();

  const applyResult = (cart: Cart) => {
    queryClient.setQueryData(cartKeys.detail(), cart);
  };

  /** Mutations are never queued or replayed: the server cart is authoritative. */
  const guard = () => {
    if (!online) throw new CartMutationBlockedError("offline");
    if (!accessToken) throw new CartMutationBlockedError("unauthenticated");
    return accessToken;
  };

  const shared = { retry: false } as const;

  const addItem = useMutation({
    ...shared,
    mutationFn: async ({ productId, quantity }: CartMutationVariables) => {
      const token = guard();
      if (!productId) throw new Error("A product is required.");
      return httpCartRepository.addItem(token, productId, quantity);
    },
    onSuccess: applyResult,
  });

  const setQuantity = useMutation({
    ...shared,
    mutationFn: async ({ productId, quantity }: CartMutationVariables) => {
      const token = guard();
      if (!productId || quantity === undefined)
        throw new Error("A product and quantity are required.");
      if (quantity < 1 || quantity > MAX_ITEM_QUANTITY) {
        throw new Error(`Quantity must be between 1 and ${MAX_ITEM_QUANTITY}.`);
      }
      return httpCartRepository.setItemQuantity(token, productId, quantity);
    },
    onSuccess: applyResult,
  });

  const removeItem = useMutation({
    ...shared,
    mutationFn: async ({ productId }: CartMutationVariables) => {
      const token = guard();
      if (!productId) throw new Error("A product is required.");
      return httpCartRepository.removeItem(token, productId);
    },
    onSuccess: applyResult,
  });

  const clearCart = useMutation({
    ...shared,
    mutationFn: async () => httpCartRepository.clearCart(guard()),
    onSuccess: applyResult,
  });

  return {
    online,
    enabled: online && Boolean(accessToken),
    addItem,
    setQuantity,
    removeItem,
    clearCart,
    refetchCart: () =>
      queryClient.invalidateQueries({ queryKey: cartKeys.detail() }),
  };
}
