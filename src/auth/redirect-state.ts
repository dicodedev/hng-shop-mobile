import type { Href } from "expo-router";

/**
 * Intended-destination allowlist.
 *
 * After sign-in the app may only return to a destination the app itself
 * declares. Arbitrary caller-supplied paths and external URLs are rejected so a
 * crafted link cannot redirect a customer off-app or into an unsafe screen.
 */
export const AUTH_INTENTS = ["cart", "orders", "account", "product"] as const;

export type AuthIntent = (typeof AUTH_INTENTS)[number];

export function isAuthIntent(value: unknown): value is AuthIntent {
  return (
    typeof value === "string" &&
    (AUTH_INTENTS as readonly string[]).includes(value)
  );
}

export function resolveIntentPath(
  intent: unknown,
  params?: { slug?: string },
): Href | null {
  if (!isAuthIntent(intent)) return null;

  switch (intent) {
    case "cart":
      return "/cart";
    case "orders":
      return "/orders";
    case "account":
      return "/account";
    case "product": {
      const slug = params?.slug;
      if (!slug || !/^[a-z0-9-]{1,80}$/.test(slug)) return null;
      return { pathname: "/product/[slug]", params: { slug } };
    }
    default:
      return null;
  }
}

/**
 * Extracts the OAuth authorization code from the provider redirect.
 * Only the `code` parameter is read; tokens are never taken from a URL.
 */
export function extractAuthorizationCode(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  const match = /[?&#]code=([^&]+)/.exec(url);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}
