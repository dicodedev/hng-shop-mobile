import type { RealtimeChannel } from "@supabase/supabase-js";

import { getSupabaseClient } from "@/auth/supabase";
import { invalidateCart } from "@/features/cart/queries";
import type { QueryClient } from "@tanstack/react-query";

type CartHeader = { version?: number | null };

/**
 * Owner-scoped cart synchronization.
 *
 * Subscribes to the authenticated customer's own `public.carts` header row and
 * never to `cart_items`. When the header version advances, the canonical cart is
 * refetched from the API rather than patched locally.
 */
export function subscribeToCartChanges(
  userId: string,
  queryClient: QueryClient,
): () => void {
  const supabase = getSupabaseClient();
  if (!supabase) return () => undefined;

  let channel: RealtimeChannel | null = supabase
    .channel(`carts:user_id=eq.${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "carts",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const next = payload.new as CartHeader | undefined;
        const version = next?.version;
        if (typeof version === "number") invalidateCart(queryClient);
      },
    )
    .subscribe();

  return () => {
    if (channel) void supabase.removeChannel(channel);
    channel = null;
  };
}
