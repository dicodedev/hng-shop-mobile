# HNG Shop Mobile Handoff

This package is the source material for a customer-facing HNG Shop mobile app built with Expo React Native. It captures the product implemented in the web repository, formalizes its design language, and defines the target mobile API without presenting proposed endpoints as already available.

## Scope

The first mobile release includes:

- Google authentication through Supabase Auth.
- Active-product catalogue and product detail.
- Authenticated Supabase-backed cart shared with the web application.
- Nigerian delivery checkout.
- Hosted Paystack payment.
- Verified payment result handling.
- Customer order history and detail.
- Account display and sign-out.

Administration remains in the web application.

## Documents

| File                                                                               | Purpose                                                                  |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`PRODUCT_SPEC.md`](PRODUCT_SPEC.md)                                               | Goals, personas, requirements, journeys, analytics, and release criteria |
| [`SCREEN_SPEC.md`](SCREEN_SPEC.md)                                                 | Expo Router navigation and screen-level behavior                         |
| [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)                                             | Visual language, tokens, components, states, content, and accessibility  |
| [`MOBILE_ARCHITECTURE.md`](MOBILE_ARCHITECTURE.md)                                 | Recommended Expo architecture, state ownership, storage, and networking  |
| [`DATA_MODEL.md`](DATA_MODEL.md)                                                   | Tables, enums, immutable snapshots, RLS, and RPC behavior                |
| [`AUTH_PAYMENTS_EMAIL.md`](AUTH_PAYMENTS_EMAIL.md)                                 | Native auth, Paystack return bridge, webhook, and Mailgun behavior       |
| [`API_CONTRACT.md`](API_CONTRACT.md)                                               | Mobile BFF conventions and endpoint summary                              |
| [`BACKEND_GAP_ANALYSIS.md`](BACKEND_GAP_ANALYSIS.md)                               | Required changes between the existing web backend and target mobile API  |
| [`TEST_AND_RELEASE_PLAN.md`](TEST_AND_RELEASE_PLAN.md)                             | Automated, integration, device, and external-service release checks      |
| [`TRACEABILITY_MATRIX.md`](TRACEABILITY_MATRIX.md)                                 | Requirement-to-screen-to-contract-to-test mapping                        |
| [`api/current-web-api.md`](api/current-web-api.md)                                 | Existing web HTTP and Supabase interface inventory                       |
| [`api/openapi.yaml`](api/openapi.yaml)                                             | Proposed OpenAPI 3.1 mobile BFF contract                                 |
| [`tokens/design-tokens.json`](tokens/design-tokens.json)                           | Portable machine-readable design tokens                                  |
| [`tokens/expo-theme.ts`](tokens/expo-theme.ts)                                     | Typed Expo/React Native token export                                     |
| [`skills/hng-shop-mobile-design/SKILL.md`](skills/hng-shop-mobile-design/SKILL.md) | Portable AI-agent design implementation skill                            |

## Sources of truth

Product behavior was derived from:

- `src/app/` and `src/components/`
- `src/lib/checkout.ts`, `src/lib/orders.ts`, `src/lib/cart.ts`, and `src/lib/cart-api.ts`
- `src/lib/paystack.ts`, `src/lib/payments.ts`, and `src/lib/email.ts`
- `supabase/migrations/`
- `src/types/database.ts`
- `README.md`, `AGENTS.md`, and `docs/IMPLEMENTATION_PLAN.md`

If these documents conflict with enforced database constraints or RLS, the database behavior wins until the contract and implementation are deliberately migrated together.

## Existing versus proposed

Labels used throughout this package:

- **Existing:** implemented in the current web repository.
- **Target:** contract intended for the mobile-compatible backend.
- **Gap:** work required before the target behavior exists.
- **Future:** explicitly outside the first mobile release.

The product, profile, shared-cart, order, and payment endpoints are implemented. Authenticated versioned endpoints accept either Supabase cookie sessions or bearer access tokens. Do not point the mobile app at cookie-only endpoints and do not put service-role, Paystack, Mailgun, or webhook secrets in the mobile repository.

Cart status labels:

- **Existing:** the database cart, RPCs, dual-auth `/api/v1/cart` routes, web client, and owner-scoped `carts` Realtime publication are implemented in source.
- **Gap:** `20261002000000_shared_cart.sql` must be applied to each target Supabase project.
- **Target:** the mobile app consumes the existing bearer-compatible routes and implements the same Realtime-header/refetch flow.

## Recommended implementation sequence

1. Apply `20261002000000_shared_cart.sql` and verify the existing bearer-authenticated cart API.
2. Configure Supabase mobile OAuth redirect URLs and app/universal links.
3. Scaffold Expo Router and consume `tokens/expo-theme.ts`.
4. Generate a typed API client from `api/openapi.yaml`.
5. Implement public catalogue and the authenticated shared-cart client.
6. Implement authentication, checkout, Paystack WebBrowser return, and payment polling.
7. Implement order history, detail, and account.
8. Complete the release matrix in `TEST_AND_RELEASE_PLAN.md`.

## Product invariants

- Nigeria only.
- NGN only; money is integer kobo.
- Free delivery within Nigeria.
- Google authentication through Supabase.
- Paystack hosted checkout; the app never handles card details.
- Server-authoritative prices and totals.
- Customer order access is owner-scoped.
- Products are active or archived; there are no stock counts.
- The canonical cart is account-owned in Supabase; clients do not persist cart data locally or mutate it offline.
- Cart product data is joined at read time and remains non-authoritative for checkout pricing.
- Payment state and email delivery state are independent.
- Database-assigned administrators remain web-only for mobile version 1.
