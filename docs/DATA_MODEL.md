# HNG Shop Data Model

## Overview

The shared Supabase database remains the source of truth. Mobile DTOs deliberately hide table implementation details and server-only payment/email fields while preserving domain semantics.

## Enums

| Enum                | Values                                                           |
| ------------------- | ---------------------------------------------------------------- |
| Role                | `customer`, `admin`                                              |
| Payment             | `awaiting_payment`, `paid`, `failed`, `refunded`                 |
| Fulfillment         | `unfulfilled`, `processing`, `shipped`, `delivered`, `cancelled` |
| Payment transaction | `initialized`, `successful`, `failed`, `abandoned`               |
| Email delivery      | `pending`, `sent`, `failed`                                      |

## Profiles

Principal fields:

- `id`: Supabase auth user UUID.
- `email`: synchronized from auth identity.
- `full_name`: synchronized from Google metadata.
- `avatar_url`: optional.
- `role`: defaults to customer and is database-assigned.

Rules:

- Auth-user triggers create/update the profile.
- Synchronization never overwrites role.
- Customers select only their own profile.
- No mobile profile or role mutation is exposed in version 1.

## Products

Principal fields:

- UUID, unique slug, name, description, image URL.
- `price_amount`: positive integer kobo.
- Currency fixed to `NGN`.
- `is_active` controls catalogue visibility and checkout eligibility.
- Creator/updater references and timestamps.

Rules:

- Public reads expose active products only.
- Admin RLS can expose and mutate archived products through web administration.
- Product edits do not change existing order snapshots.
- Product delete may be blocked by order item foreign keys; archive instead.

Mobile representation:

```json
{
  "id": "uuid",
  "slug": "adire-weekender",
  "name": "Adire Weekender",
  "description": "...",
  "imageUrl": "https://...",
  "price": { "currency": "NGN", "amountKobo": 2850000 }
}
```

## Orders

Principal fields:

- Internal UUID and unique human-facing order number.
- Authenticated owner UUID.
- Customer identity and delivery snapshot.
- NG/NGN-only country/currency.
- Subtotal, zero delivery, and total in kobo.
- Payment and fulfillment states.
- Per-user idempotency UUID.
- Paid and audit timestamps.

Constraints:

- Unique `(user_id, idempotency_key)`.
- Delivery country `NG`.
- Currency `NGN`.
- Delivery amount zero.
- Total equals subtotal plus delivery.
- Nigerian E.164 phone.
- Six-digit postal code.
- Paid/refunded orders require `paid_at`.
- Awaiting/failed orders cannot have `paid_at`.

The database currently constrains state by length rather than membership. The target BFF must enforce the complete 36 states plus Federal Capital Territory and should eventually move this rule into shared/database validation.

## Carts

`20261002000000_shared_cart.sql` adds one `carts` header per authenticated profile and `cart_items` keyed by `(cart_id, product_id)`.

Stored cart fields:

- `carts`: owner UUID, monotonic version, and timestamps.
- `cart_items`: product UUID, quantity from 1 through 99, item version, and timestamps.
- At most 50 distinct lines is enforced by mutation RPCs.
- Product name, slug, image, active state, currency, and current price are not copied into `cart_items`; `get_my_cart` joins them from `products`.

Security and synchronization:

- Anonymous users cannot read or mutate carts.
- Authenticated users may select only their own `carts` header for Supabase Realtime.
- `cart_items` is not directly exposed to authenticated clients; all reads and mutations use RPC-backed `/api/v1/cart` routes.
- Clients subscribe to owner-scoped header updates and refetch the canonical API when `carts.version` advances.

## Order item snapshots

Each order item stores:

- Product UUID.
- Product name at purchase time.
- Product image at purchase time.
- Quantity.
- Unit price in kobo.
- Line total in kobo.

Rules:

- Quantity 1–99.
- Unique product per order.
- Line total equals unit price multiplied by quantity.
- Product changes never rewrite snapshots.

## Payment transactions

Principal fields:

- Order UUID.
- Provider fixed to Paystack.
- Unique reference.
- Optional unique provider transaction ID.
- Amount and NGN currency.
- Transaction status and failure message.
- Paid and audit timestamps.

Current implementation creates one transaction whose reference equals the order number. The target payment-session design should support retry semantics deliberately. If multiple provider attempts are required, add a migration and issue a unique reference per attempt rather than changing historical migration files.

## Email deliveries

Principal fields:

- One `order_confirmation` row per order.
- Recipient email snapshot.
- Status, attempt count, provider message ID, last error, and sent timestamp.

Payment and email are independent. A failed email must never change a paid order. The current implementation makes one immediate attempt and has no durable retry worker.

## Order detail DTO

```json
{
  "orderId": "uuid",
  "orderNumber": "HNG-2026-ABCD1234",
  "paymentStatus": "paid",
  "fulfillmentStatus": "unfulfilled",
  "subtotal": { "currency": "NGN", "amountKobo": 2850000 },
  "shipping": { "currency": "NGN", "amountKobo": 0 },
  "total": { "currency": "NGN", "amountKobo": 2850000 },
  "createdAt": "2026-10-01T11:55:00Z",
  "paidAt": "2026-10-01T12:00:00Z",
  "emailStatus": "sent",
  "items": [],
  "delivery": {}
}
```

## RPC behavior

### `create_order`

- Uses `auth.uid()` and synchronized profile email.
- Acquires an advisory lock for user plus idempotency key.
- Returns an existing order before revalidating a changed replay payload.
- Validates item count, UUIDs, integer quantities, duplicates, active products, and availability.
- Calculates prices from current products.
- Creates order, snapshots, transaction, and pending email delivery atomically.

### `create_order_from_cart`

- Derives identity from `auth.uid()` and locks the user's canonical cart.
- Reads product IDs and quantities from `cart_items`; checkout clients send delivery data and idempotency only.
- Delegates active-product validation and authoritative pricing to `create_order`.
- Captures each ordered cart-item version on newly created order items.

### `mark_order_paid`

- Service-role only.
- Locks payment and order rows.
- Requires known reference, exact amount, and matching NGN currency.
- Returns `newly_paid = false` for a repeated paid transition.
- On first settlement, removes only ordered cart lines whose current item version equals the version captured at order creation.
- Preserves lines changed or re-added while payment was in progress and advances the cart header version when lines are removed.

### Customer reads

- `get_my_orders` and `get_my_order` derive identity from `auth.uid()`.
- The private detail builder is not directly executable by authenticated users.

## RLS matrix

| Resource             | Anonymous   | Customer             | Admin                    | Service role |
| -------------------- | ----------- | -------------------- | ------------------------ | ------------ |
| Active products      | Read        | Read                 | Read/write all           | All          |
| Archived products    | None        | None                 | Read/write               | All          |
| Own profile          | None        | Read own             | Read own by table policy | All          |
| Own cart header      | None        | Read own             | Read own by table policy | All          |
| Cart items           | None        | RPC only             | RPC only                 | All          |
| Orders               | None        | Read own             | Read all                 | All          |
| Order items          | None        | Read own-order items | Read all                 | All          |
| Payment transactions | None        | Read own-order rows  | Read all                 | All          |
| Email deliveries     | None        | Read own-order rows  | Read all                 | All          |
| Product images       | Public read | Public read          | Write                    | All          |

## Migration policy

- Apply migrations in filename order.
- Apply `20261002000000_shared_cart.sql` after the initial schema and order workflow migrations and before the seed.
- Never rewrite migration history already applied to a shared environment.
- Add a new migration for mobile API database changes.
- Regenerate `src/types/database.ts` after schema or RPC changes.
- Keep OpenAPI DTOs separate from generated database types.
