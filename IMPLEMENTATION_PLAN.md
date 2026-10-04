# HNG Shop Implementation Plan

## Product decisions

- Brand: HNG Shop
- Market: Nigeria
- Currency: NGN, stored and processed in kobo
- Shipping: Nigeria only, free shipping
- Authentication: Google through Supabase Auth
- Payments: hosted Paystack checkout
- Email: Mailgun confirmation after verified payment
- Administration: database-assigned admins manage products and orders
- Product media: Supabase Storage
- Inventory: active/inactive products only; no stock counts
- Deployment: Vercel
- Visual direction: modern editorial

## Phase 1: Project foundation

Status: Completed on 2026-10-01

Scope:

- Scaffold Next.js with the App Router, TypeScript, Tailwind CSS, and pnpm.
- Enable strict TypeScript, ESLint, Prettier, and Vitest.
- Protect local environment files and provide credential-free variable names.
- Establish responsive layout, metadata, brand configuration, and design tokens.

Acceptance criteria:

- [x] `pnpm install` completes and creates a lockfile.
- [x] Formatting, linting, type checking, tests, and production build pass.
- [x] Real environment files are ignored and `.env.example` is tracked.
- [x] The HNG Shop shell renders responsively on mobile and desktop.
- [x] No Phase 2 or later service integration is included.

Completed work:

- Added the pinned Next.js, React, TypeScript, Tailwind CSS, and pnpm foundation.
- Added strict TypeScript, Next.js ESLint rules, Prettier, and Vitest scripts.
- Added an environment-variable template and Git exclusions for local secrets and generated artifacts.
- Added HNG Shop metadata, reusable site configuration, responsive application chrome, design tokens, and an editorial launch page.
- Added a smoke test for the approved brand and Nigerian market configuration.

Verification:

- `pnpm install`: passed; `pnpm-lock.yaml` generated.
- `pnpm format:check`: passed.
- `pnpm lint`: passed with no warnings or errors.
- `pnpm typecheck`: passed.
- `pnpm test`: passed, 1 test file and 1 test.
- `pnpm build`: passed; `/` and `/_not-found` prerendered successfully.

## Phase 2: Supabase schema

Status: Completed on 2026-10-01

Scope:

- Add versioned migrations for profiles, products, orders, order items, payment transactions, and email deliveries.
- Add constraints, indexes, profile synchronization, row-level security, and demo seed data.
- Add a public product-image bucket with admin-only write policies.
- Generate TypeScript database types.

Acceptance criteria:

- [x] The migration applies to a clean PostgreSQL database with Supabase auth and storage schemas.
- [x] Seeded active products are readable publicly.
- [x] Unauthorized writes and cross-user order reads are denied.
- [x] Admin authorization is controlled by the database-assigned profile role.

Completed work:

- Added the initial migration for profiles, products, orders, order items, Paystack transaction records, and Mailgun delivery records.
- Added constrained NGN minor-unit amounts, payment and fulfillment enums, foreign keys, uniqueness rules, timestamps, and query indexes.
- Added profile synchronization triggers that preserve the database-assigned application role.
- Added least-privilege grants and RLS for public products, customer-owned data, and admin product management.
- Added a public `product-images` bucket with database-assigned admin write policies and a 5 MB image limit.
- Added six deterministic demo products and generated-compatible TypeScript database types.
- Added PostgreSQL migration and RLS integration tests plus a native Supabase pgTAP policy suite.

Verification:

- Clean migration and seed execution through PGlite PostgreSQL: passed.
- RLS integration coverage for public reads, denied writes, customer isolation, role escalation, and admin product/image access: passed.
- `pnpm format:check`: passed.
- `pnpm lint`: passed with no warnings or errors.
- `pnpm typecheck`: passed.
- `pnpm test`: passed, 2 test files and 5 tests.
- `pnpm build`: passed; `/` and `/_not-found` prerendered successfully.
- `supabase test db`: not run in this environment because the Supabase CLI and Docker are unavailable; the executable pgTAP suite is committed at `supabase/tests/database_rls.test.sql`.

## Phase 3: Product catalog

Status: Completed on 2026-10-01

Scope:

- Build database-backed product listing and product detail routes.
- Add responsive product imagery and loading, empty, error, and not-found states.

Acceptance criteria:

- [x] Active products render from Supabase.
- [x] Product details are addressable by slug.
- [x] Inactive and missing products resolve to the not-found state and cannot enter a purchase flow.

Completed work:

- Added a typed, server-only Supabase client using only the public project URL and publishable key.
- Added active-product listing and slug lookup queries with sanitized operational error reporting.
- Replaced the launch placeholder with a responsive editorial product catalog backed by Supabase.
- Added responsive product cards, optimized remote imagery, NGN formatting from integer kobo, and product metadata.
- Added product detail pages and dedicated loading, empty, error, and not-found experiences.
- Added allowed image patterns for the seeded Unsplash catalog and future Supabase Storage product uploads.
- Documented the public catalog environment requirements and product routes.

Verification:

- Configured Supabase catalog request: passed with HTTP 200.
- Seeded `/products/adire-weekender` request: passed with HTTP 200.
- Inactive-product visibility remains covered by the Phase 2 PostgreSQL RLS integration test.
- `pnpm format:check`: passed.
- `pnpm lint`: passed with no warnings or errors.
- `pnpm typecheck`: passed.
- `pnpm test`: passed, 3 test files and 8 tests.
- `pnpm build`: passed; `/` and `/products/[slug]` compile as dynamic server-rendered routes.

## Phase 4: Cart

Status: Completed on 2026-10-01

Scope:

- Add authenticated cart state backed by Supabase.
- Support add, remove, and quantity changes.
- Calculate display totals with integer arithmetic.

Acceptance criteria:

- [x] Cart state survives refresh, sign-out, and OAuth redirects as account data.
- [x] Invalid quantities are prevented.
- [x] Cart operations and totals have unit coverage.

Completed work:

- Added a canonical Supabase cart shared across signed-in clients, with RPC-backed mutations and authenticated API reads.
- Added strict validation for joined product data, quantities, response versions, and the 50-line limit.
- Added product-detail add controls and a live cart count in the global header.
- Added a responsive cart page with remove, clear, increment, decrement, subtotal, empty, loading, and disabled checkout states.
- Required Google sign-in before add-to-cart and removed client cart persistence.
- Added owner-scoped cart-header Realtime synchronization followed by canonical API refetch.
- Kept displayed prices non-authoritative and documented server-side repricing for checkout.
- Updated type checking to regenerate Next.js route types before running TypeScript.
- Added unit and database coverage for cart operations, parsing, limits, owner isolation, synchronization versions, and concurrent payment edits.

Verification:

- `/cart` production runtime request: passed with HTTP 200.
- Product detail with cart control production runtime request: passed with HTTP 200.
- `pnpm lint`: passed with no warnings or errors.
- `pnpm typecheck`: passed after generating route types.
- `pnpm test`: passed, 4 test files and 16 tests.
- `pnpm build`: passed; `/cart` prerendered successfully.

## Phase 5: Google authentication

Status: Implementation completed on 2026-10-01; Google dashboard verification pending

Scope:

- Add Supabase SSR clients and session refresh.
- Add Google sign-in, callback, sign-out, and protected routes.
- Synchronize authenticated profiles.

Acceptance criteria:

- [ ] Google login produces a server-readable session. Implementation is complete; end-to-end verification requires configured Google and Supabase dashboards.
- [x] Anonymous checkout and order access are rejected.
- [x] OAuth redirects safely return users to checkout.

Completed work:

- Added Supabase SSR server clients with cookie reads and writes.
- Added Next.js proxy-based session refresh with preservation of refreshed cookies across redirects.
- Added server-initiated Google OAuth, PKCE callback exchange, generic auth failure handling, and POST-only sign-out.
- Added strict same-origin `next` validation to prevent open redirects and authentication loops.
- Added early protection for account, checkout, order, success, and admin paths plus page-level account authorization.
- Added an authenticated account page backed by the synchronized profile row and a session-aware header link.
- Documented Google Cloud Console, Supabase provider, redirect allowlist, and application URL configuration.
- Added tests for protected path matching, redirect preservation, malicious redirect rejection, and application-origin validation.

Verification:

- Anonymous `/account` request: redirected to `/auth/sign-in?next=%2Faccount`.
- Anonymous `/checkout?step=shipping` request: redirected with the complete safe destination preserved.
- Anonymous `/orders/HNG-001` request: redirected to sign in.
- Missing-code `/auth/callback` request: redirected to the generic auth error page.
- Sign-in page request: passed with HTTP 200.
- `pnpm lint`: passed with no warnings or errors.
- `pnpm test`: passed, 5 test files and 22 tests.
- `pnpm build`: passed and registered `src/proxy.ts` as Proxy middleware.
- Google consent and callback exchange: pending external credentials and dashboard configuration.

## Phase 6: Checkout experience

Status: Completed on 2026-10-02

Scope:

- Add customer name, Nigerian phone, and shipping-address fields.
- Add cart summary, client and server validation, and submission states.

Acceptance criteria:

- Empty and invalid checkouts cannot be submitted.
- Errors are actionable and accessible.
- Repeated clicks cannot start parallel submissions.

Completed work:

- Added protected checkout with Nigerian name, phone, state, address, and postal-code validation.
- Added responsive order summary, hydration and empty states, accessible errors, and duplicate-submit prevention.
- Reduced checkout payloads to delivery details and an idempotency key; the database reads the canonical cart.

## Phase 7: Atomic orders and Paystack

Status: Completed on 2026-10-02; live Paystack verification pending external credentials

Scope:

- Create orders atomically using authoritative database prices.
- Add idempotency and hosted Paystack initialization.
- Verify callbacks and signed webhooks before marking payment complete.

Acceptance criteria:

- Orders and items commit together or roll back together.
- Browser-supplied totals cannot affect persisted totals.
- Unauthorized, invalid, inactive, and malformed items are rejected.
- Repeated requests, callbacks, and webhooks do not duplicate orders or payments.
- Paystack amount, currency, reference, and signature are verified server-side.

Completed work:

- Added atomic, server-authoritative order creation with per-user idempotency locking.
- Added hosted Paystack initialization, callback verification, signed webhooks, and idempotent payment transitions.
- Added database coverage for repricing, replay behavior, amount/currency validation, and paid-only fulfillment.

## Phase 8: Mailgun confirmation

Status: Completed on 2026-10-02; live Mailgun verification pending external credentials

Scope:

- Add server-only Mailgun delivery after verified payment.
- Add text and HTML order templates and persist delivery results.

Acceptance criteria:

- A paid order triggers at most one immediate confirmation attempt.
- Required customer and order details are present.
- Mailgun failures do not invalidate paid orders.
- Mailgun credentials never enter browser code.

Completed work:

- Added escaped text and HTML confirmation templates and a server-only Mailgun client.
- Added delivery outcome recording without coupling email failure to paid-order state.
- Added provider and template unit coverage.

## Phase 9: Customer orders

Status: Completed on 2026-10-02

Scope:

- Add payment result, order-success, and customer order-history pages.
- Remove unchanged ordered cart lines during verified payment settlement.

Acceptance criteria:

- Customers can access only their own orders.
- Refreshing result pages does not repeat payment or order side effects.
- Persisted server totals and statuses are displayed.

Completed work:

- Added payment result, order success, order history, and owned order-detail routes.
- Added persisted status, address, item snapshot, and database-total presentation.
- Added settlement-time removal of only cart lines whose versions still match their order snapshots, preserving concurrent edits.

## Phase 10: Administration

Status: Completed on 2026-10-02

Scope:

- Add protected admin product CRUD with Supabase Storage uploads.
- Add order listing, detail, and fulfillment-status management.

Acceptance criteria:

- Only database-assigned admins can access admin routes and mutations.
- Products can be created, edited, archived, and assigned images.
- Admins can review paid orders and update fulfillment status.

Completed work:

- Added database-role guarded dashboard, product editor, archive controls, and Storage uploads.
- Added order review and paid-only fulfillment updates.
- Repeated authorization in page guards, PostgreSQL functions, RLS, and Storage policy.

## Phase 11: Testing, hardening, and documentation

Status: Completed on 2026-10-02; external service and responsive browser verification pending

Scope:

- Complete business-logic, authorization, payment, email, and critical browser-flow tests.
- Add security headers and final error handling.
- Document architecture, all external dashboards, migrations, testing, and Vercel deployment.

Acceptance criteria:

- Formatting, linting, type checking, tests, and production build pass.
- Core flows are verified at mobile, tablet, and desktop widths.
- A new developer can configure and deploy the application without undocumented credentials.

Completed work:

- Added payment, email, checkout, order parsing, authentication, cart, and PostgreSQL workflow tests.
- Added application-wide security headers and hardened provider/API failure handling.
- Documented environment variables, Google, Supabase, Paystack, Mailgun, administration, and Vercel deployment.

## Phase 12: Authenticated shared cart

Status: Implementation completed on 2026-10-02; migration application pending per deployed environment

Scope:

- Replace device persistence with one Supabase-backed cart per authenticated account.
- Expose the same cart to web cookie sessions and mobile bearer sessions through `/api/v1/cart`.
- Synchronize clients through an owner-scoped Realtime cart header and canonical API refetch.
- Create orders from the locked database cart and preserve concurrent edits during payment settlement.

Acceptance criteria:

- [x] Google sign-in is required before add-to-cart or cart reads.
- [x] Cart lines persist product IDs and quantities only; reads join current product data.
- [x] RPC mutations enforce at most 50 lines and quantities from 1 through 99.
- [x] Checkout clients send delivery data and idempotency only.
- [x] First verified settlement removes only ordered lines unchanged since order creation.
- [x] Sign-out retains the account cart and offline mutations are disabled.
- [ ] `20261002000000_shared_cart.sql` is applied and Realtime is verified in each external Supabase environment.

Completed work:

- Added `carts` and `cart_items`, owner RLS, authenticated mutation/read RPCs, and owner-header Realtime publication.
- Added dual cookie/bearer cart route handlers for read, clear, add, set quantity, and remove operations.
- Added web Realtime synchronization that refetches the canonical API when the cart version advances.
- Added `create_order_from_cart` to lock and read the database cart before authoritative order creation.
- Added cart-item version capture and settlement-time removal that preserves lines edited while payment is open.
- Removed browser cart persistence and local client payment cleanup.
