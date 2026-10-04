import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { useAuth } from "@/auth/session-provider";
import { httpOrdersRepository } from "@/features/orders/orders-repository";
import type { OrderPage } from "@/features/orders/schema";

export const ordersKeys = {
  all: ["orders"] as const,
  list: () => [...ordersKeys.all, "list"] as const,
  detail: (orderNumber: string) =>
    [...ordersKeys.all, "detail", orderNumber] as const,
};

/**
 * Owner-scoped order history.
 *
 * Transient memory only: order data is never written to device storage and is
 * invalidated on foreground, order creation, and payment resolution.
 */
export function useOrdersQuery() {
  const { accessToken, status: authStatus } = useAuth();

  return useInfiniteQuery({
    queryKey: ordersKeys.list(),
    queryFn: ({ pageParam }) => {
      if (!accessToken) throw new Error("Sign in to view your orders.");
      return httpOrdersRepository.listOrders(accessToken, pageParam);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: OrderPage) =>
      lastPage.page.hasMore
        ? (lastPage.page.nextCursor ?? undefined)
        : undefined,
    enabled: authStatus === "authenticated" && Boolean(accessToken),
    staleTime: 30_000,
  });
}

export function useOrderQuery(orderNumber: string) {
  const { accessToken, status: authStatus } = useAuth();

  return useQuery({
    queryKey: ordersKeys.detail(orderNumber),
    queryFn: () => {
      if (!accessToken) throw new Error("Sign in to view this order.");
      return httpOrdersRepository.getOrder(accessToken, orderNumber);
    },
    enabled:
      authStatus === "authenticated" &&
      Boolean(accessToken) &&
      orderNumber.length > 0,
    staleTime: 30_000,
  });
}
