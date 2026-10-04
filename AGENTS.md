# HNG Shop Mobile Agent Guide

## Project Overview

HNG Shop Mobile is the customer-facing iOS and Android application for HNG Shop. It is built with Expo React Native and shares its backend and account-owned cart with the existing web application.

The application should feel like a calm, editorial storefront rather than a generic marketplace. Administration remains web-only.

## Sources of Truth

Read the relevant documents before changing behavior:

1. `docs/PRODUCT_SPEC.md` for scope, journeys, and domain rules.
2. `docs/SCREEN_SPEC.md` for navigation and screen behavior.
3. `docs/DESIGN_SYSTEM.md` for visual and accessibility rules.
4. `docs/MOBILE_ARCHITECTURE.md` for state, storage, and networking decisions.
5. `docs/API_CONTRACT.md` and `docs/api/openapi.yaml` for HTTP contracts.
6. `docs/AUTH_PAYMENTS_EMAIL.md` for authentication and payment security.
7. `docs/TEST_AND_RELEASE_PLAN.md` for release gates.
8. `docs/BACKEND_GAP_ANALYSIS.md` before integrating a new backend operation.

If documentation conflicts with enforced database constraints or RLS, backend enforcement wins until the contract is deliberately migrated.

## Current Status

Milestone three is implemented:

- Expo Router application shell.
- Shop, product detail, not-found, sign-in, cart, checkout, payment, orders, and account screens.
- Responsive editorial design system.
- Development fixtures captured from the live catalogue response on 2026-10-03.
- HTTP catalogue repository with cursor pagination.
- Shared transport client with timeouts, cursor-safe query building, and problem normalization.
- Runtime response validation and generated OpenAPI types.
- Public catalogue query persistence and offline display.
- Google OAuth PKCE through Supabase with SecureStore-backed sessions.
- Bearer-authenticated shared account cart with owner-scoped Realtime synchronization.
- Nigerian delivery validation with complete 36-state plus FCT coverage.
- Order creation with a retained idempotency key and no client-supplied prices.
- Hosted Paystack payment with bounded status polling and return-link parsing.
- Unit, component, and live contract tests.

The deployed origin is `https://hng-shop-task.vercel.app`.

Backend state verified on 2026-10-03:

| Operation                                            | State                                                                           |
| ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| `GET /api/v1/products`                               | Live and contract compliant (`200`, `{ data, page }`)                           |
| `GET /api/v1/products/{slug}`                        | Live and contract compliant (`200`); missing and archived both return `404`     |
| `GET /api/v1/me`                                     | Live and contract compliant (`401` unauthenticated, `application/problem+json`) |
| `GET`/`DELETE /api/v1/cart`                          | Live; `401` unauthenticated with the legacy `{ code, error }` error shape       |
| `POST /api/v1/cart/items`                            | Live; `401` unauthenticated                                                     |
| `PATCH`/`DELETE /api/v1/cart/items/{productId}`      | Live; `401` unauthenticated                                                     |
| `POST /api/v1/orders`                                | Live; `401` unauthenticated (`application/problem+json`)                        |
| `GET /api/v1/orders`                                 | Live; `401` unauthenticated                                                     |
| `GET /api/v1/orders/{orderNumber}`                   | Live; `401` unauthenticated                                                     |
| `GET /api/v1/orders/{orderNumber}/payment-status`    | Live; `401` unauthenticated                                                     |
| `POST /api/v1/orders/{orderNumber}/payment-sessions` | Live; `401` unauthenticated                                                     |
| `GET /payments/paystack/return`                      | Live; rejects a bad reference with `400 INVALID_PAYMENT_REFERENCE`              |
| `POST /api/webhooks/paystack`                        | Live; rejects an invalid signature with `401`                                   |

Every customer operation is deployed and answers with the documented problem
shape when unauthenticated. Keep `pnpm test:contract` passing: it probes all
fifteen operations and fails on drift.

Retain the HTML rejection in `src/api/client.ts`. A status code alone is never
sufficient evidence of a valid response, because a route that falls through to the
web application can answer `200 text/html`.

Two error shapes are currently deployed:

- `application/problem+json` with `type`, `title`, `status`, `code`, `detail`, `requestId`.
- Legacy `{ "code": "...", "error": "..." }` from the shared-cart routes.

`src/api/client.ts` normalizes both into `ApiProblemError` while preserving
`status`, `code`, `requestId`, and field errors.

Do not scrape web HTML or silently replace failed production API requests with
fixtures. Fixture modules remain in release bundles, so never add a runtime
fallback that selects them after a failed request.

## Product Invariants

- Market and delivery area: Nigeria only.
- Locale: `en-NG`.
- Currency: NGN only.
- Represent money as integer kobo in state and transport. Divide by 100 only when formatting.
- Delivery is complimentary and has a zero-kobo server value.
- Public browsing is anonymous; adding to cart requires Google sign-in.
- Authentication uses Supabase Google OAuth with PKCE.
- Auth tokens belong in platform secure storage, never AsyncStorage or logs.
- The canonical cart is account-owned in Supabase and shared with the web application.
- Never persist cart payloads locally or queue offline cart mutations.
- Checkout sends delivery fields and an idempotency key, not prices, totals, or cart lines.
- PostgreSQL is authoritative for active products, prices, totals, identity, and payment state.
- Payments use hosted Paystack. The app never handles card details.
- A browser return or deep link is navigation only, never proof of payment.
- Customer order access must remain owner-scoped.
- Product availability is active/archived; do not invent stock counts or variants.
- Mobile version 1 has no administration features.

## Technology

- Expo SDK 57 and React Native.
- Expo Router with file-based routes under `app/`.
- Strict TypeScript with `noUncheckedIndexedAccess`.
- TanStack Query for server state.
- AsyncStorage persistence only for queries explicitly marked `meta.persist === true`.
- Expo Image for remote product images.
- NetInfo for connectivity state.
- Zod for runtime API validation.
- OpenAPI TypeScript for generated transport types.
- Jest and React Native Testing Library.
- pnpm as the package manager.

Use SDK-compatible dependency versions. Run `pnpm exec expo install --check` after dependency changes.

## Repository Structure

```text
app/                              Expo Router route entry points
app/(tabs)/                       Shop, Cart, Orders, and Account tabs
app/product/[slug].tsx            Product detail route
app/auth/sign-in.tsx              Google OAuth PKCE route
app/checkout/index.tsx            Delivery details and order creation
app/payment/processing.tsx        Bounded payment-status polling
app/payment/result.tsx            Deep-link return target
app/order/[orderNumber].tsx       Order detail route
src/api/                          Transport client, errors, generated OpenAPI types
src/auth/                         Supabase config, secure storage, session, redirect policy
src/components/                   Shared presentation components including ScreenHeader
src/design/theme.ts               Runtime design tokens
src/features/catalogue/           Catalogue data, repositories, queries, and screens
src/features/cart/                Cart schema, repository, queries, Realtime, screen
src/features/checkout/            Delivery validation, idempotency store, checkout screen
src/features/orders/              Order schemas, repository, queries, history, detail
src/features/payments/            Payment state machine, return parsing, payment screens
src/features/account/             Profile query and account screen
src/lib/                          Domain utilities such as money formatting
src/providers/                    Application-level providers and lifecycle wiring
src/test/                         Shared test setup
docs/                             Product, design, backend, and release specifications
```

Keep route files thin. Feature behavior belongs under `src/features/`; reusable primitives belong under `src/components/`.

## Environment

Allowed public variables:

```text
EXPO_PUBLIC_API_URL=https://hng-shop-task.vercel.app/api/v1
EXPO_PUBLIC_CATALOGUE_SOURCE=fixtures|api
EXPO_PUBLIC_SUPABASE_URL=<supabase-project-url>
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
EXPO_PUBLIC_AUTH_REDIRECT_URL=<fixed-allowlisted-redirect>
```

Development defaults to `fixtures` when the source is unspecified. Release bundles default to `api`. Fixture selection must remain explicit and must never occur as a fallback after an API failure.

The repository root `.env` currently also contains backend server secrets. Those belong to the backend repository and must be removed from this repository. Expo only inlines `EXPO_PUBLIC_*` values, so they do not reach a bundle, but their presence here is an avoidable leak risk.

Never add these to Expo variables, source, logs, tests, or build artifacts:

- Supabase service-role key.
- Paystack secret or webhook secret.
- Mailgun API key.
- Database credentials.
- Customer access or refresh tokens.

The bundle identifiers in `app.json` are temporary placeholders and must be replaced before OAuth or store builds:

- iOS: `com.example.hngshop`
- Android: `com.example.hngshop`
- Development scheme: `hngshop-dev`

The resolved OAuth redirect is `hngshop-dev://auth/callback`. Register it in the Supabase Auth redirect allowlist, and replace both the scheme and the placeholder identifiers before store builds.

## Common Commands

```bash
pnpm install
pnpm start
pnpm ios
pnpm android
pnpm web
pnpm generate:api
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:contract
pnpm export
pnpm exec expo install --check
```

`pnpm test` runs the offline `unit` project. `pnpm test:contract` runs the
`contract` project in a Node environment against the deployed origin and needs
network access; use it after backend deployments to detect contract drift.

Regenerate `src/api/generated/schema.d.ts` after changing `docs/api/openapi.yaml`. Do not manually edit generated files.

## Architecture Rules

### API boundaries

- Screens consume feature queries, not `fetch` directly.
- Repositories own transport differences.
- `src/api/client.ts` owns base URL resolution, bounded timeouts, `Accept` headers, and JSON-only decoding.
- Validate every external response before putting it into query state.
- Success DTO schemas must ignore unknown members. The contract permits additive
  optional fields in version 1, so strict object parsing is a defect, not rigor.
- Keep generated API DTOs separate from database types.
- Preserve stable HTTP status, problem code, request ID, and field errors when normalizing failures.
- Retry GET requests conservatively. Do not automatically retry mutations unless their contract defines safe idempotency.
- Customer requests use `Authorization: Bearer <supabase-access-token>`; never synthesize web cookies.

### Catalogue

- `fixtureCatalogueRepository` is for explicit development and tests.
- `httpCatalogueRepository` is the production path.
- Persist only public catalogue queries.
- Cached catalogue content may render offline with a clear offline marker.
- Archived cached products remain non-authoritative and must be rejected by checkout.

### Authentication

- Use Supabase mobile OAuth PKCE and an allowlisted app/universal link.
- Store sessions with an Expo SecureStore-backed adapter.
- Preserve intended navigation with a small internal destination allowlist.
- Reject arbitrary return URLs.
- Clear transient customer state on sign-out, but never delete the server cart.

### Cart

- Use the bearer-compatible `/api/v1/cart` routes documented in OpenAPI.
- Keep cart data in transient query memory only.
- Subscribe to the owner-scoped `public.carts` header, never directly to `cart_items`.
- Refetch the canonical cart when its version advances, connectivity returns, the app foregrounds, or payment is verified.
- Disable mutations offline; do not queue them.
- Enforce UI limits while relying on the server as authority: 50 lines and quantity 1 through 99.

### Checkout and payment

- Retain one UUID idempotency key across order-creation retries.
- Preserve the order number after successful order creation even if payment initialization fails.
- Open Paystack with Expo WebBrowser.
- On browser return or app foreground, fetch authenticated payment status.
- Poll only for a bounded period while the app is active.
- Render success only after the API returns `paid`.
- Refetch the cart after verified settlement; never clear it locally.

## Navigation Rules

- The tab bar exists only on the four tab routes. Every other screen renders on
  the root stack above `(tabs)`, where `headerShown` is false, so stack screens
  must provide their own chrome with `ScreenHeader`.
- Use `ScreenHeader` on every stack screen. Do not add bespoke top bars.
- Back controls declare an explicit destination. `ScreenHeader` uses smart back
  (`dismissTo` when history exists, otherwise `replace`), so a cold deep link
  lands on a real route instead of exiting the app.
- The visible back label is a single word, for example `Back`, because header
  space is limited. The destination is carried by `accessibilityLabel`, for
  example "Back to orders", so screen-reader users still hear where it leads.
- Never rely on bare `router.back()` outside a `canGoBack()` guard.
- The cart control is shown on product detail and order detail only. Hide it
  during checkout and payment so a customer is not diverted mid-purchase.
- Every stack screen must offer a way back to the shop. Order detail previously
  had no escape route, which trapped customers on a paid order.
- Leaving checkout discards the delivery draft held in component state, so the
  back control confirms abandonment when the draft is dirty.
- Cart counts come from `useCartItemCount()` so the tab badge and the header
  control can never disagree.

## Design Rules

- Use tokens from `src/design/theme.ts`; do not introduce close-enough colors.
- Background is warm paper, text is near-black, and terracotta is the interactive accent.
- Use serif typography for display hierarchy and uppercase sans-serif labels for utility text.
- Prefer spacing and fine rules over generic rounded cards and shadows.
- Product imagery is the dominant catalogue element.
- Maintain deliberate editorial rhythm rather than identical product tiles.
- Primary buttons are pill-shaped, ink-colored, and at least 48 points high.
- Minimum touch target is 44 by 44 points.
- Support Dynamic Type without fixed text-container heights or clipped actions.
- Collapse multi-column layouts when width or font scale makes them unsuitable.
- Status must always include text; color alone is insufficient.
- Do not add decorative gradients, glass effects, default blue controls, fake scarcity, or unsupported delivery claims.

Approved customer language includes:

- `Objects for living well.`
- `Complimentary delivery across Nigeria.`
- `Prices are confirmed securely before payment.`
- `sign in`, not `login`.
- `cart`, not `basket`.
- `fulfilment` in customer prose; retain `fulfillment` in API identifiers.

## Accessibility

- Give each screen one logical heading.
- Add roles, labels, hints, busy states, and live announcements where meaningful.
- Product actions should announce product name and formatted price.
- Quantity controls must include the product name and resulting action.
- Associate validation errors with fields and announce them once.
- Respect reduced-motion settings.
- Verify critical flows with VoiceOver and TalkBack before release.
- Test small phones, large phones, and large accessibility text sizes.

## Testing Expectations

Add tests with behavior changes. At minimum, cover:

- Domain utilities and validation boundaries.
- API success, malformed response, stable error, and not-found behavior.
- Loading, empty, offline, error, and disabled component states.
- Accessibility labels and roles for interactive controls.
- Navigation-relevant behavior.
- Security-sensitive redirect, authentication, idempotency, and payment logic.

Jest runs two projects. `unit` uses the Expo preset and mocks `fetch`. `contract`
runs in Node with real HTTP and is excluded from `pnpm test`; it lives in
`src/**/*.contract.ts` and must stay free of React Native imports.

Before considering work complete, run:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm exec expo install --check
```

Run `pnpm test:contract` after backend deployments, and `pnpm export` for changes that affect routing, native modules, app configuration, providers, or bundling.

## Next Milestone

All fifteen contract operations are deployed. The remaining work is device
verification and release hardening:

1. Replace `com.example.hngshop` and the `hngshop-dev` scheme with real values.
2. Register the resolved OAuth redirect in the Supabase Auth allowlist, then move
   to universal/app links before store submission.
3. Create a development build. OAuth with a custom scheme cannot work in Expo Go,
   which overrides the app scheme and sends customers to the web Site URL.
4. Verify on device: Google consent, secure session persistence across restart,
   bearer cart reads and writes, cross-client cart sync with the web app, and the
   full Paystack path including return, webhook-only settlement, and cancellation.
5. Confirm the shared-cart migration is applied in the target Supabase project and
   that the `public.carts` Realtime publication is active.
6. Confirm a verified Mailgun sending domain. Sandbox cannot reach customers.
7. Decide the Paystack retry model. The order number currently doubles as the
   provider reference, which supports idempotent re-initialisation but keeps no
   history of multiple attempts.

## Completion Standard## Completion Standard

A change is complete only when it:

- Preserves the product invariants and security boundaries.
- Matches the documented native behavior and design system.
- Handles loading, empty, offline, error, and accessibility states where applicable.
- Does not introduce browser-cookie assumptions or server secrets.
- Includes appropriate automated tests.
- Passes formatting, linting, type checking, tests, dependency compatibility, and relevant bundle export checks.
