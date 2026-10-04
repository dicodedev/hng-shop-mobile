import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useAuth } from "@/auth/session-provider";
import { subscribeToCartChanges } from "@/features/cart/realtime";

/**
 * Keeps the canonical cart in step with the account.
 *
 * Subscribes to the owner-scoped cart header while signed in and drops
 * transient cart state on sign-out. The server cart itself is never deleted.
 */
export function CartSyncProvider() {
  const { userId, status } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status !== "authenticated" || !userId) {
      queryClient.removeQueries({ queryKey: ["cart"] });
      return;
    }

    const unsubscribe = subscribeToCartChanges(userId, queryClient);
    return () => unsubscribe();
  }, [userId, status, queryClient]);

  return null;
}
