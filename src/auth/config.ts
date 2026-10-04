import { createURL } from "expo-linking";

/**
 * Client-safe Supabase configuration.
 *
 * Only the project URL and publishable key are ever read here. The service-role
 * key must never reach this application.
 */
export function getSupabaseUrl(): string | null {
  const value = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  return value && value.length > 0 ? value : null;
}

export function getSupabasePublishableKey(): string | null {
  const value = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  return value && value.length > 0 ? value : null;
}

export function isAuthConfigured(): boolean {
  return getSupabaseUrl() !== null && getSupabasePublishableKey() !== null;
}

/**
 * OAuth and payment redirects must be fixed and allowlisted. This resolves to
 * the development scheme (`hngshop-dev://auth/callback`) until real app or
 * universal links replace it in `app.json`.
 */
export function getAuthRedirectUrl(): string {
  const configured = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL?.trim();
  if (configured && configured.length > 0) return configured;
  return createURL("/auth/callback");
}
