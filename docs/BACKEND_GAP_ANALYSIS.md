# Backend Gap Analysis

## Summary

The current backend is secure for its web use case but most customer surfaces remain cookie-oriented and lack a stable native API. The shared-cart slice is the exception: its `/api/v1/cart` routes already accept cookie or bearer authentication. The mobile application should not depend on current HTML pages, Next.js server actions, or browser cookie assumptions.

## Required before mobile integration

| Gap                   | Current state                         | Required target                                            |
| --------------------- | ------------------------------------- | ---------------------------------------------------------- |
| Bearer authentication | APIs use Supabase cookie sessions     | Validate Supabase bearer JWT and create user-scoped client |
| Versioned JSON API    | No `/api/v1` customer read API        | Implement OpenAPI operations                               |
| Product reads         | Stable active-product DTO endpoints   | Connect and verify the mobile client                       |
| Profile read          | Dual-authenticated `GET /api/v1/me`   | Connect and verify the mobile client                       |
| Order reads           | Owner-scoped paginated JSON endpoints | Connect and verify the mobile client                       |
| Payment status        | Owner-scoped JSON polling endpoint    | Connect and verify the mobile client                       |
| Native OAuth          | Web callback creates cookies          | Supabase mobile PKCE and app links                         |
| Payment return        | Fixed mobile redirect bridge          | Configure and verify the installed app link                |
| Error format          | `{ error: string }`                   | Stable machine codes and request IDs                       |
| Pagination            | Fixed order limit                     | Opaque cursor pagination                                   |

The bearer-authentication row is a gap for the broader BFF, not for the existing shared-cart routes.

## Shared cart status

- **Existing:** `carts`/`cart_items`, authenticated RPC mutations, dual-auth `/api/v1/cart` routes, web consumption, owner-scoped `carts` Realtime publication, cart-backed checkout, and version-aware paid-order line removal are implemented in source.
- **Gap:** apply `20261002000000_shared_cart.sql` to each deployed Supabase project and verify Realtime publication/schema refresh there.
- **Target:** mobile uses bearer auth against the existing cart routes, subscribes to its owner-scoped cart header, and refetches the API when the header version advances.

## Required before production

### Service configuration

- Apply all four database migrations to the production Supabase project, including `20261002000000_shared_cart.sql` and `20261003000000_order_list_index.sql`.
- Configure non-empty service-role key server-side.
- Configure Paystack webhook URL and test/live keys per environment.
- Use a verified Mailgun domain, not a sandbox domain for customers.
- Configure production Google and Supabase mobile redirect URLs.
- Configure iOS associated domains and Android asset links.

### Payment reliability

- Payment-session retries deliberately reuse the order number as the single Paystack reference.
- If multiple attempts are required, add a migration and provider-attempt model.
- Separate payment settlement outcome from email outcome in all callback/webhook paths.
- Add request IDs and safe settlement logging.
- Rate-limit payment session and verification endpoints.

### Email reliability

- Add durable retry or an explicit operational resend mechanism.
- Alert on sustained failed or pending confirmation deliveries.
- Keep provider errors sanitized and bounded.

### API hardening

- Add strict DTO validation at the BFF boundary.
- Return `404` for missing and non-owned orders.
- Add `Cache-Control: private, no-store` for customer data.
- Add request size limits.
- Add abuse/rate controls.
- Add API contract tests against OpenAPI examples.

## Domain inconsistencies to resolve

### Federal Capital Territory

The current checkout list contains all 36 states but omits Federal Capital Territory. The target contract includes `Federal Capital Territory`. Update shared validation and database coverage before mobile release.

### Payment retry model

Current order number is also the unique Paystack reference. Payment-session retries deliberately reinitialize that reference; the system does not retain a history of provider attempts.

### State validation location

The database checks only shipping-state string length. A direct RPC caller could bypass the HTTP allowlist. Move the region rule into shared/database validation or ensure the mobile BFF is the only supported mutation path.

### Money type

PostgreSQL uses `bigint`, while generated JavaScript database types use `number`. The BFF must enforce JSON safe-integer bounds or use decimal strings. The proposed mobile contract bounds integer kobo to `Number.MAX_SAFE_INTEGER`.

### Email/customer messaging

Current callback copy can claim confirmation email before reading persisted email outcome, and can imply the order is already on its way. Align copy with actual payment, fulfillment, and email statuses.

## Recommended later

- Push notifications for payment and fulfillment changes.
- Saved addresses.
- Support/contact surface.
- Admin email resend.
- Refund workflow.
- Shipment carrier and tracking.
- Catalogue search and categories.

## Intentional limitations

- Nigeria only.
- NGN only.
- Free delivery.
- No stock quantities.
- No variants.
- Google-only authentication.
- Hosted Paystack payment.
- Database-assigned roles.
- Customer-only mobile version 1.

## Suggested backend work sequence

1. Reuse the existing cart auth resolver pattern for BFF operations that need web cookie or mobile bearer access without service-role impersonation.
2. Reuse the existing DTO validators and standard problem responses.
3. Connect and verify the existing product and profile reads.
4. Connect and verify the owner-scoped order reads and creation endpoint.
5. Configure and verify the payment-session, status, and return endpoints.
6. Add rate limiting, request IDs, and contract tests.
7. Add durable email retry or admin resend.
