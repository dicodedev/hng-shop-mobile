import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabasePublishableKey, getSupabaseUrl } from "@/auth/config";
import { secureStoreAdapter } from "@/auth/secure-store-adapter";

let client: SupabaseClient | null = null;

/**
 * Lazily created Supabase client.
 *
 * Returns `null` when public configuration is missing so the application can
 * render an explicit "not configured" state instead of crashing at startup.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const publishableKey = getSupabasePublishableKey();
  if (!url || !publishableKey) return null;
  if (client) return client;

  client = createClient(url, publishableKey, {
    auth: {
      storage: secureStoreAdapter,
      // The native app receives the OAuth code through WebBrowser, not a
      // browser URL fragment, so session detection is disabled here.
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
      flowType: "pkce",
    },
  });

  return client;
}

/** Test seam. Never call from product code. */
export function resetSupabaseClientForTests(): void {
  client = null;
}
