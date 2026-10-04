# Target Mobile API Contract

## Status

This is the version 1 contract for the mobile-compatible backend. The canonical machine-readable definition is `api/openapi.yaml`. Product, profile, and shared-cart endpoints are existing in source. Authenticated endpoints accept cookie or bearer authentication, and cart operations require the shared-cart migration in each deployed database. The remaining mobile operations are targets unless explicitly marked existing.

## Base URL and versioning

```text
https://<canonical-origin>/api/v1
```

- Breaking request/response changes require a new major path version.
- Additive optional fields may be introduced within version 1.
- Clients must ignore unknown response fields.
- Deprecated fields remain documented for at least one supported mobile release cycle.

## Authentication

Authenticated operations require:

```http
Authorization: Bearer <supabase-access-token>
```

The backend validates the token through Supabase Auth and performs user-scoped database operations. It must not replace customer identity with a service-role client.

Public product endpoints do not require authentication.

The existing cart endpoints also accept the web application's Supabase cookie session. Mobile must use bearer authentication and must not attempt to synthesize cookies.

## Conventions

- JSON property names use camelCase.
- Database enum values remain snake_case for parity.
- Timestamps are ISO 8601 UTC strings.
- Money uses explicit integer-kobo fields.
- IDs are UUID strings.
- Order numbers match `HNG-YYYY-XXXXXXXX`.
- `null` represents known absence; omitted fields are not part of the representation.
- Responses containing customer data use `Cache-Control: private, no-store`.

## Errors

Errors follow an RFC 9457-inspired shape:

```json
{
  "type": "https://hng.shop/problems/product-unavailable",
  "title": "Product unavailable",
  "status": 422,
  "code": "PRODUCT_UNAVAILABLE",
  "detail": "One or more products are unavailable.",
  "requestId": "uuid",
  "errors": [
    {
      "field": "items[0].productId",
      "code": "INACTIVE_PRODUCT"
    }
  ]
}
```

Stable status usage:

| Status | Meaning                                                                      |
| ------ | ---------------------------------------------------------------------------- |
| `400`  | Malformed JSON, query, or path input                                         |
| `401`  | Missing, invalid, or expired access token                                    |
| `403`  | Authenticated but not allowed                                                |
| `404`  | Missing or non-owned resource                                                |
| `409`  | Invalid state transition or idempotency conflict                             |
| `422`  | Structurally valid request with invalid domain fields or unavailable product |
| `429`  | Rate limited                                                                 |
| `502`  | Upstream provider failed                                                     |
| `503`  | Required backend workflow/configuration unavailable                          |

## Pagination

List endpoints use opaque cursor pagination:

```json
{
  "data": [],
  "page": {
    "nextCursor": null,
    "hasMore": false
  }
}
```

- Default limit: 20.
- Maximum limit: 50.
- Cursors are opaque and must not be parsed by clients.

## Endpoint summary

### `GET /products` (**Existing**)

Public active-product list.

Query:

- `cursor`, optional.
- `limit`, 1–50.

### `GET /products/{slug}` (**Existing**)

Public active product detail. Missing and archived products both return `404`.

### `GET /me` (**Existing**)

Returns authenticated profile identity. No profile or role mutation endpoint exists.

### `GET /cart` (**Existing**)

Returns the authenticated account's canonical cart. The response contains a cart-header version and current product data joined onto each persisted product ID and quantity.

### `DELETE /cart` (**Existing**)

Clears all current cart lines through the authenticated `clear_my_cart` RPC.

### `POST /cart/items` (**Existing**)

Adds an active product or increments an existing line. Body: `productId` and optional `quantity` (default 1).

### `PATCH /cart/items/{productId}` (**Existing**)

Sets an existing line's absolute quantity.

### `DELETE /cart/items/{productId}` (**Existing**)

Removes the line when present. Every successful mutation returns the complete canonical cart.

Cart rules:

- Authentication is required before read or add.
- Maximum 50 distinct lines and quantity 1–99.
- Mutations are RPC-backed and require connectivity; clients do not queue offline writes.
- `cart_items` persists product IDs, quantities, and version metadata only. Current product fields are joined when read.
- Web and mobile share the same cart. Sign-out does not delete it.
- Subscribe to the owner-scoped `public.carts` header in Supabase Realtime, then refetch `GET /cart` when its version advances. Never subscribe directly to `cart_items`.

### `POST /orders` (**Existing**)

Creates or replays an order using server-authoritative product data.

Header:

```http
Idempotency-Key: <uuid>
```

Request includes delivery fields only. The idempotency key is the header; the backend calls `create_order_from_cart`, which locks and reads the authenticated database cart.

- `201`: new order.
- `200`: idempotent replay.
- Response includes `idempotencyReplayed`.

### `GET /orders` (**Existing**)

Owner-scoped cursor-paginated order summaries.

### `GET /orders/{orderNumber}` (**Existing**)

Owner-scoped detail with immutable line snapshots and delivery information. Missing and non-owned resources both return `404`.

### `POST /orders/{orderNumber}/payment-sessions` (**Existing**)

Initializes hosted Paystack checkout for an owned unpaid order. Retries reuse the order number as the single provider reference; there is no provider-attempt history or persisted authorization URL.

Header:

```http
Idempotency-Key: <uuid>
```

The server derives reference, amount, currency, email, and callback URL. Clients supply none of those values.

### `GET /orders/{orderNumber}/payment-status` (**Existing**)

Small owner-scoped polling response used after the app returns from Paystack or resumes from the background.

### `GET /payments/paystack/return` (**Existing**)

Public provider return bridge outside `/api/v1`.

Behavior:

1. Validate reference format.
2. Verify transaction with Paystack.
3. Settle idempotently.
4. Attempt confirmation after first settlement.
5. Redirect only to a fixed configured app/universal link.

The fixed redirect is configured through the server-only `PAYSTACK_RETURN_URL`. Development uses `hngshop-dev://payment/result`; production should use an allowlisted app/universal link. The redirect carries `orderNumber` and a non-authoritative `outcome` only. The app fetches authenticated payment status before rendering success.

### `POST /api/webhooks/paystack`

Existing provider endpoint. Signature verification and raw-body handling remain server-only.

## Idempotency and retries

- Order creation requires a UUID key.
- Network timeouts are retried with the same key.
- Replays return the original order even if the canonical cart has changed.
- Payment-session retry must not create another order.
- Payment settlement remains idempotent across webhook, return bridge, and manual verification races.

## Rate limiting targets

| Endpoint class      | Suggested limit                          |
| ------------------- | ---------------------------------------- |
| Public catalogue    | 120 requests/minute/device-IP pair       |
| Authenticated reads | 120 requests/minute/user                 |
| Order creation      | 10 requests/minute/user                  |
| Payment session     | 10 requests/10 minutes/user              |
| Payment status      | 30 requests/minute/user/order            |
| Return verification | 20 requests/10 minutes/reference-IP pair |

Limits are product defaults, not implemented behavior. Return `429` with `Retry-After`.

## Mobile client behavior

- Generate DTOs from `openapi.yaml` rather than importing database types.
- Refresh expired Supabase sessions before retrying once.
- Do not automatically retry non-idempotent operations without the documented idempotency key.
- Treat `401` as a session recovery event.
- Treat `404` for order detail as missing without revealing ownership.
- Treat `502` payment-session errors as recoverable because an order may already exist.
- Treat deep-link results as navigation only.
- Keep cart data in transient memory only; do not use AsyncStorage.
- Refetch the cart after a newer owner-cart Realtime version, reconnect, foreground, or verified payment.
- Do not clear cart lines locally. Verified settlement removes only ordered lines whose versions are unchanged, preserving concurrent edits.
