# HNG Shop Mobile Architecture

## Target stack

- Expo React Native.
- Expo Router.
- TypeScript strict mode.
- Supabase JavaScript client for mobile OAuth/session management.
- Platform secure storage for auth tokens.
- AsyncStorage only for non-sensitive preferences; never for cart persistence.
- Generated API DTOs/client from `api/openapi.yaml`.
- A server-state query library with persistence limited to public catalogue data.
- Expo WebBrowser and app/universal links for Paystack.
- Expo Image or equivalent native image cache.

This document recommends architecture but does not mandate a specific form or server-state library.

## Proposed repository structure

```text
app/
├── _layout.tsx
├── (tabs)/
├── product/
├── checkout/
├── payment/
├── order/
├── auth/
└── +not-found.tsx
src/
├── api/
│   ├── client.ts
│   ├── generated/
│   ├── errors.ts
│   └── auth.ts
├── auth/
│   ├── supabase.ts
│   ├── session-provider.tsx
│   └── redirect-state.ts
├── cart/
│   ├── cart-store.ts
│   ├── realtime.ts
│   ├── validation.ts
│   └── types.ts
├── components/
│   ├── primitives/
│   ├── products/
│   ├── checkout/
│   └── orders/
├── design/
│   ├── theme.ts
│   └── typography.ts
├── features/
│   ├── catalogue/
│   ├── checkout/
│   ├── orders/
│   └── payments/
├── links/
│   ├── linking.ts
│   └── payment-return.ts
├── observability/
├── storage/
└── test/
```

## State ownership

| State                 | Owner                 | Persistence                              |
| --------------------- | --------------------- | ---------------------------------------- |
| Supabase session      | Supabase auth adapter | Secure storage                           |
| Public catalogue      | Server-state cache    | Optional persisted read cache            |
| Product detail        | Server-state cache    | Optional persisted read cache            |
| Cart                  | Supabase/database     | API-backed; transient client cache only  |
| Checkout draft        | Checkout feature      | Memory; optional non-sensitive draft     |
| Idempotency key       | Checkout attempt      | Persist until order response resolves    |
| Orders                | Server-state cache    | Memory; invalidate on foreground/payment |
| Payment browser state | Payment feature       | Memory plus order number                 |
| Payment truth         | Backend/database      | Never inferred locally                   |

## Authentication architecture

1. Configure Supabase with an Expo-compatible storage adapter backed by secure storage.
2. Start Google OAuth with PKCE.
3. Use an allowlisted HTTPS app/universal link where possible; custom schemes are acceptable for local development.
4. Exchange the OAuth callback through the Supabase mobile SDK.
5. Store access and refresh tokens only in secure storage.
6. Attach the access token to BFF requests as `Authorization: Bearer`.
7. Refresh once on token expiry, then return to sign-in if recovery fails.

Do not send mobile tokens to the current cookie callback or attempt to synthesize browser cookies.

## API client

- Generate request and response DTOs from `api/openapi.yaml`.
- Wrap generated transport with auth-token injection and request IDs.
- Normalize RFC-style errors into domain errors without discarding `code`, `status`, `requestId`, or field errors.
- Do not map unknown server errors to payment success.
- Restrict automatic retries to idempotent GET requests and documented idempotent mutations.
- Apply a bounded timeout and cancellation when screens unmount.

Recommended retry behavior:

| Operation              | Retry                               |
| ---------------------- | ----------------------------------- |
| Product/order GET      | Up to 2 with exponential backoff    |
| Create order           | Same idempotency key only           |
| Create payment session | Same order and idempotency key only |
| Payment status         | Bounded polling while app active    |
| Authentication         | SDK-managed refresh once            |
| Cart reads             | Retry after connectivity returns    |
| Cart mutations         | No offline retry or queued mutation |

## Cart architecture

Use a lightweight in-memory view over the canonical account cart. The existing backend routes accept web cookie sessions and mobile Supabase bearer tokens:

- `GET`/`DELETE /api/v1/cart`
- `POST /api/v1/cart/items`
- `PATCH`/`DELETE /api/v1/cart/items/{productId}`

Canonical response shape:

```json
{
  "version": 8,
  "updatedAt": "2026-10-02T12:00:00Z",
  "items": [
    {
      "id": "uuid",
      "slug": "adire-weekender",
      "name": "Adire Weekender",
      "imageUrl": "https://...",
      "priceAmount": 2850000,
      "currency": "NGN",
      "quantity": 1,
      "available": true,
      "version": 3
    }
  ]
}
```

Rules:

- Validate every API response before rendering it.
- Never persist cart payloads in AsyncStorage or another device store.
- Require Google sign-in before add, read, or mutation.
- Maximum 50 distinct lines and 99 units per line.
- Persist only product IDs, quantities, and version metadata in PostgreSQL; the API joins current product data.
- Treat joined prices as display-only; checkout prices again in PostgreSQL.
- Subscribe through Supabase Realtime to the authenticated user's owner-scoped `public.carts` row, not `cart_items`.
- When the cart header version advances, refetch `GET /api/v1/cart`; also refetch on foreground and reconnect.
- Verified settlement removes only ordered lines whose item version is unchanged since order creation. Refetch after paid status and never clear locally.
- Signing out drops transient cart state but does not delete the account cart.

## Catalogue and offline behavior

- Cache active product pages and individual product detail.
- Render stale cached content while refreshing when appropriate.
- Display an offline marker when freshness cannot be confirmed.
- Disable cart mutations, checkout, and order refresh offline.
- An archived cached product may remain visible offline but will be rejected authoritatively at checkout.

## Checkout state machine

```text
idle
  -> validating
  -> creating_order
  -> order_created
  -> creating_payment_session
  -> opening_paystack
  -> awaiting_return
  -> verifying
  -> paid | pending | failed | recoverable_error
```

Requirements:

- Persist the idempotency key before sending the create-order request.
- Keep the key across timeout/retry.
- Replace it only after a definitive order response or explicit abandonment.
- Preserve order number after order creation even if payment initialization fails.
- Never combine a local browser-return event with a paid state without an API fetch.

## Payment return and app lifecycle

- Paystack returns to a backend HTTPS URL.
- The backend verifies and redirects to a fixed app/universal link.
- The app extracts only the order number and navigation outcome.
- On return or foreground, fetch `payment-status`.
- Poll while `awaiting_payment` with capped exponential delay, then present `Check again`.
- The webhook remains authoritative when the app never returns.

Do not put access tokens, email, amount, currency, or provider transaction payloads in app links.

## Server-state invalidation

Invalidate:

- Product list after app foreground if cache is stale.
- Order list after order creation.
- Order detail and list after payment resolves.
- Payment status after app foreground.
- Profile after auth refresh.
- Cart after a newer owner-scoped cart-header Realtime event, foreground, reconnect, or verified payment.

## Environment model

Client-safe Expo variables may include only:

- Public BFF origin.
- Supabase URL.
- Supabase publishable key.
- App-link origin/scheme.
- Non-secret analytics identifiers.

Never include:

- Supabase service-role key.
- Paystack secret or webhook secret.
- Mailgun key.
- Database password.

Use separate development, preview/staging, and production Supabase/Paystack/Mailgun environments where possible.

## Observability

Client logs may include:

- Request ID.
- API operation name.
- HTTP status.
- Stable error code.
- App version, platform, and non-sensitive state.

Client logs must not include:

- Tokens.
- Provider payloads.
- Full email, phone, address, or customer name.
- Cart/product payloads when unnecessary.

Track crash-free sessions and payment funnel transitions. Correlate customer reports through order number and server request ID.

## Security checklist

- Secure-store auth tokens.
- No server secrets in bundle or OTA update.
- Fixed OAuth and payment redirect allowlists.
- TLS-only production endpoints.
- Owner-scoped order APIs.
- Owner-scoped cart-header Realtime subscription followed by canonical API refetch.
- No local cart persistence or offline mutation queue.
- Idempotency for order/payment mutations.
- App link claims configured for iOS and Android.
- Screenshot/redaction policy considered for customer PII screens.
- Debug logging disabled or sanitized in release builds.
