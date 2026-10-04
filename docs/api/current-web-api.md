# Existing Web API and Data Interface

This document describes what exists in the current repository. It is not the complete target mobile contract. Most current Next.js customer route handlers authenticate through Supabase cookie sessions; versioned profile, cart, order, and payment routes accept either those cookies or a Supabase bearer access token.

## HTTP endpoints

### Product and profile endpoints

| Endpoint                      | Authentication                | Behavior                       |
| ----------------------------- | ----------------------------- | ------------------------------ |
| `GET /api/v1/products`        | Public                        | Paginated active-product list  |
| `GET /api/v1/products/{slug}` | Public                        | Active product detail          |
| `GET /api/v1/me`              | Cookie or Supabase bearer JWT | Authenticated profile identity |

Product responses use stable camelCase DTOs and integer-kobo NGN prices without exposing product administration fields. Profile responses are owner-scoped by RLS and use `Cache-Control: private, no-store`.

### Order and payment endpoints

| Endpoint                                                | Behavior                                       |
| ------------------------------------------------------- | ---------------------------------------------- |
| `POST /api/v1/orders`                                   | Create/replay from the locked canonical cart   |
| `GET /api/v1/orders`                                    | Owner-scoped cursor-paginated summaries        |
| `GET /api/v1/orders/{orderNumber}`                      | Owner-scoped immutable order detail            |
| `POST /api/v1/orders/{orderNumber}/payment-sessions`    | Initialize/reuse hosted Paystack checkout      |
| `GET /api/v1/orders/{orderNumber}/payment-status`       | Read authoritative payment/fulfillment status  |
| `GET /payments/paystack/return?reference={orderNumber}` | Verify, settle, and redirect to the mobile app |

Authenticated endpoints accept cookie or bearer sessions and return `private, no-store` responses. The public return route uses only server-side Paystack verification and redirects to the fixed server-configured `PAYSTACK_RETURN_URL`; deep-link query data is never payment authority.

### `POST /api/checkout`

Authentication: Supabase cookie session.

Request:

```json
{
  "customer": {
    "name": "Ada Nwosu",
    "phone": "+2348012345678",
    "line1": "12 Allen Avenue",
    "line2": null,
    "city": "Ikeja",
    "state": "Lagos",
    "postalCode": "100001"
  },
  "idempotencyKey": "uuid"
}
```

Success:

```json
{
  "authorizationUrl": "https://checkout.paystack.com/example",
  "orderNumber": "HNG-2026-ABCD1234",
  "totalAmount": 2850000
}
```

Behavior:

- Validates Nigerian delivery fields and the idempotency key; it does not read or trust request cart lines.
- Calls `public.create_order_from_cart` as the authenticated user.
- Locks and reads the canonical database cart before delegating authoritative pricing to `public.create_order`.
- PostgreSQL obtains active products, current prices, customer email, and user identity.
- Initializes Paystack after the order transaction commits.
- A retry with the same idempotency key reuses the original order.

Statuses:

- `400`: invalid request or unavailable products.
- `401`: unauthenticated.
- `403`: database authorization failure.
- `500`: unexpected persistence or response failure.
- `502`: order saved but Paystack initialization failed.
- `503`: workflow migration/RPC missing from PostgREST.

Mobile limitation: cookie-only authentication, combined order/payment operation, and ad hoc error strings.

### Shared cart endpoints

Authentication: Supabase cookie session or `Authorization: Bearer <supabase-access-token>`.

| Endpoint                                | Behavior                                 |
| --------------------------------------- | ---------------------------------------- |
| `GET /api/v1/cart`                      | Read/create the caller's canonical cart  |
| `DELETE /api/v1/cart`                   | Remove all current lines                 |
| `POST /api/v1/cart/items`               | Add a product or increment its quantity  |
| `PATCH /api/v1/cart/items/{productId}`  | Set an existing line's absolute quantity |
| `DELETE /api/v1/cart/items/{productId}` | Remove one product line                  |

All successful operations return the complete canonical cart and `Cache-Control: private, no-store`. Mutations call authenticated PostgreSQL RPCs, enforce at most 50 distinct products and quantities from 1 through 99, and reject inactive products. `cart_items` stores only product IDs, quantities, and concurrency metadata; responses join current product name, slug, image, price, currency, and active state.

The `public.carts` header is owner-readable and published through Supabase Realtime. Web and mobile clients subscribe to their own row, compare its version, and refetch `GET /api/v1/cart`; clients do not subscribe directly to `cart_items`.

Source status: these routes and bearer support are **Existing**. Deployment status: `20261002000000_shared_cart.sql` must be applied and the Realtime/PostgREST configuration verified. Native mobile consumption is **Target**.

### `POST /api/webhooks/paystack`

Authentication: `x-paystack-signature` HMAC-SHA512 over the exact raw body.

Behavior:

- Rejects invalid signatures before JSON parsing.
- Handles `charge.success` and `charge.failed`.
- Ignores other signed events.
- Uses service-role RPCs for settlement.
- Sends confirmation only on `newly_paid = true`.
- Returns a retryable `500` when a valid successful charge cannot be persisted.

### `POST /api/admin/products`

Authentication: cookie session. Authorization: product table RLS.

Creates, edits, publishes, or archives products through direct `products` table writes. Prices are integer kobo. Images must use approved Unsplash or configured Supabase Storage URLs.

Mobile version 1 does not consume this endpoint.

### `POST /api/admin/product-images`

Authentication: cookie session. Authorization: Storage RLS.

Accepts JPEG, PNG, WebP, or AVIF up to 5 MiB and returns a public bucket URL.

Mobile version 1 does not consume this endpoint.

### `POST /api/admin/orders`

Authentication: cookie session. Authorization: admin-checking RPC.

Updates fulfillment status for paid orders.

Mobile version 1 does not consume this endpoint.

## Browser-flow endpoints

### `GET /auth/callback`

Exchanges a Supabase OAuth authorization code for a cookie session and redirects to a sanitized web path. It does not return tokens to a native application.

### `POST /auth/sign-out`

Signs out the cookie session and redirects to `/`. It is not a JSON or bearer-token endpoint.

### `GET /payment/callback?reference=...`

Public server-rendered page that verifies Paystack server-side, settles through a service-role RPC, attempts confirmation email, and renders HTML. First verified settlement removes only ordered database-cart lines whose item version is unchanged since order creation; concurrent edits remain.

Mobile limitations:

- Callback URL is fixed to `NEXT_PUBLIC_APP_URL`.
- Response is HTML.
- It cannot redirect safely into a native app.
- It has no authenticated JSON payment-status result.

## Existing RPCs

### Authenticated customer

| Function                    | Arguments            | Purpose                                       |
| --------------------------- | -------------------- | --------------------------------------------- |
| `get_my_cart`               | none                 | Joined canonical account cart                 |
| `add_my_cart_item`          | `uuid, integer`      | Add/increment an active product               |
| `set_my_cart_item_quantity` | `uuid, integer`      | Set an existing line quantity                 |
| `remove_my_cart_item`       | `uuid`               | Remove one cart line                          |
| `clear_my_cart`             | none                 | Remove all cart lines                         |
| `create_order_from_cart`    | `jsonb, uuid`        | Lock cart and create a server-priced order    |
| `create_order`              | `jsonb, jsonb, uuid` | Atomic server-priced order creation primitive |
| `get_my_orders`             | none                 | Newest 50 owner-scoped orders                 |
| `get_my_order`              | `text`               | Owner-scoped order detail                     |

### Authenticated admin

Each function repeats `private.is_admin()`.

| Function                       | Purpose                                        |
| ------------------------------ | ---------------------------------------------- |
| `admin_set_fulfillment_status` | Paid-only fulfillment update                   |
| `admin_get_order`              | Detailed order read                            |
| `admin_list_orders`            | Filtered newest-first order list               |
| `admin_save_product`           | Product upsert; currently unused by HTTP route |
| `admin_order_summary`          | Dashboard counters                             |

### Service role only

| Function                    | Purpose                                         |
| --------------------------- | ----------------------------------------------- |
| `mark_order_paid`           | Idempotent amount/currency-checked settlement   |
| `mark_order_payment_failed` | Failure transition without changing paid orders |
| `get_order_for_delivery`    | Full order/contact model for email              |
| `record_email_delivery`     | Persist sent/failed delivery result             |

## Direct Supabase reads

The web application currently performs server-side Supabase reads for:

- Active products and product detail.
- Current profile.
- Owner cart header through Realtime; cart payloads are read through RPC-backed HTTP routes.
- Customer order list and detail through RPCs.
- Admin summary and order/product lists.

A native app could technically use Supabase directly with a publishable key and user JWT, but doing so would expose database naming and bypass some HTTP-layer validation. The target mobile contract therefore uses a versioned BFF.

## Existing wire inconsistencies

- Product and checkout HTTP payloads use camelCase.
- Order RPC payloads use snake_case.
- Errors contain localized strings but no stable machine code.
- Order lists have fixed limits rather than cursors.
- PostgreSQL `bigint` is represented as JavaScript `number` in generated types.
- The current checkout state list omits Federal Capital Territory.

## Sources

- `src/app/api/checkout/route.ts`
- `src/app/api/webhooks/paystack/route.ts`
- `src/app/api/admin/`
- `src/app/auth/`
- `src/app/payment/callback/page.tsx`
- `supabase/migrations/20261001000000_initial_schema.sql`
- `supabase/migrations/20261001000001_order_workflow.sql`
- `supabase/migrations/20261002000000_shared_cart.sql`
