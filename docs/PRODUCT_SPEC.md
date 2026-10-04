# HNG Shop Mobile Product Specification

## Document status

- Product: HNG Shop mobile application
- Target: Expo React Native for iOS and Android
- Release scope: customer application only
- Locale: `en-NG`
- Market: Nigeria
- Currency: NGN
- Backend: shared Supabase project plus a proposed versioned mobile BFF

## Product vision

HNG Shop mobile is a considered way to discover and purchase a curated collection of everyday objects for modern Nigerian life. The mobile experience should feel editorial and calm while making authentication, delivery details, hosted payment, and order tracking dependable.

The application is not a marketplace, inventory system, social shopping platform, or broad retail catalogue. It is a focused storefront with a small collection and strong visual presentation.

## Product principles

1. **Editorial, not generic.** Product discovery should feel curated rather than like a dense marketplace grid.
2. **Trust the server.** The account cart and displayed product data come from the backend; PostgreSQL determines products, prices, totals, identity, currency, and payment state.
3. **Native where it matters.** Navigation, safe areas, gestures, secure storage, forms, and accessibility should follow iOS and Android conventions.
4. **Provider-hosted payment.** Paystack owns sensitive payment UI. The app treats deep links as navigation, never proof of payment.
5. **Calm failure recovery.** Errors explain what happened and provide a safe next step without exposing provider or database details.
6. **Nigeria by design.** NGN, Nigerian phones, states/FCT, addresses, delivery language, and local payment channels are first-class.

## Goals

- Let anonymous shoppers browse products and require Google sign-in before adding to a cart.
- Let customers sign in with Google through Supabase Auth.
- Create orders atomically from authoritative active-product prices.
- Complete payment through hosted Paystack checkout.
- Recover correctly when the app is backgrounded, killed, or never receives the payment return link.
- Show owner-scoped order history and persisted statuses.
- Reuse the existing HNG Shop visual and content language.

## Non-goals for version 1

- Product or order administration.
- Guest checkout.
- Stock counts, back-ordering, or inventory reservations.
- Product options, sizes, colours, or variants.
- Search, categories, filters, sorting, recommendations, or recently viewed items.
- Wishlist, ratings, reviews, referral, loyalty, discount, or gift-card systems.
- Saved addresses or payment methods.
- In-app refunds, returns, cancellations, or exchanges.
- Shipment carriers, tracking numbers, or delivery estimates.
- Push notifications.
- Offline cart mutation.
- Dark mode or localization beyond `en-NG`.

## Personas

### Anonymous shopper

Wants to understand the collection and compare products before deciding to authenticate.

Needs:

- Fast product browsing.
- Clear NGN pricing.
- Clear sign-in handoff when adding a product.
- No forced sign-in for catalogue browsing.

### Authenticated customer

Wants a secure checkout, confidence that payment is recorded correctly, and access to past orders.

Needs:

- Google sign-in.
- Nigerian delivery validation.
- Hosted Paystack payment.
- Reliable return from WebBrowser to app.
- Payment status recovery if the return is missed.
- Order history and detail.

### Operations/support user

Uses the existing web admin rather than the mobile app. Mobile customer flows must preserve order numbers and clear statuses so support can reconcile issues through the web dashboard.

## Core journeys

### Browse and add

1. Open app on Shop tab.
2. Load active products.
3. Open a product detail screen.
4. Sign in with Google if needed.
5. Add one unit to the account cart.
6. Continue shopping or open Cart.

Acceptance criteria:

- Only active products appear.
- Missing or archived product links produce the same not-found state.
- Prices display as NGN but remain integer kobo in state.
- Add-to-cart requires an authenticated session.
- Add action increments an existing line up to 99.
- Cart badge updates and an accessible confirmation is announced.

### Manage cart

1. Open Cart tab.
2. Increase, decrease, or remove lines.
3. Review display subtotal.
4. Continue to checkout.

Acceptance criteria:

- Cart is refetched from the canonical API across app restarts and devices.
- Cart is retained in the account after sign-out.
- Maximum 50 distinct products and 99 units per product.
- Decrementing from one removes the item.
- Subtotal is labelled as subject to server confirmation.
- Mutations require connectivity; failed mutations are not queued for later replay.

### Authenticate

1. Anonymous shopper attempts to add a product, begins checkout, or opens Orders/Account.
2. App launches Supabase Google OAuth with PKCE.
3. Provider returns through an allowlisted app/universal link.
4. App stores tokens in platform secure storage.
5. Shopper returns to the intended protected screen.

Acceptance criteria:

- External or caller-supplied return destinations are rejected.
- Authentication tokens never enter AsyncStorage or logs.
- The account cart is available after OAuth and is not copied into device storage.
- Cancelling OAuth returns to a recoverable sign-in state.
- The app never offers admin role assignment.

### Checkout

Required fields:

- Full name, 2–120 characters.
- Nigerian phone normalized to `+234[7-9][0-9]{9}`.
- Address line 1, 3–160 characters.
- Optional address line 2, maximum 160 characters.
- City, 2–100 characters.
- Nigerian state or Federal Capital Territory.
- Six-digit postal code.

Acceptance criteria:

- Empty carts cannot be submitted.
- Client validation is immediate and accessible.
- The backend repeats validation.
- Requests contain delivery fields and an `Idempotency-Key`; they do not contain cart lines, prices, or product copy.
- An `Idempotency-Key` UUID protects retries.
- Parallel submissions are blocked locally.
- Server response returns persisted total and order number.

### Pay

1. Backend creates or replays the order.
2. App requests a hosted Paystack session for the owned order.
3. App opens the authorization URL with Expo WebBrowser.
4. Paystack returns to a fixed HTTPS backend URL.
5. Backend verifies and settles payment.
6. Backend redirects to a fixed app/universal link carrying only the order number and navigation result.
7. App fetches payment status from the authenticated API.

Acceptance criteria:

- Card data never touches HNG Shop clients or servers.
- The app never trusts query/deep-link success, amount, currency, or reference.
- Backend verifies Paystack status, reference, amount, and NGN currency.
- Webhook and return races are idempotent.
- Backgrounding or killing the app cannot lose the order.
- App polls status on foreground for a bounded period.
- Verified settlement removes ordered lines only when their cart-item version is unchanged; the app then refetches the cart.

### Review orders

1. Open Orders tab.
2. View newest orders with payment and fulfillment state.
3. Open order detail.

Acceptance criteria:

- Only owned orders are visible.
- Non-owned and missing order numbers both return `404`.
- Item names, images, prices, and totals use immutable order snapshots.
- Status is communicated with text, not colour alone.
- Pending and failed orders provide a payment-recovery action when eligible.

## Domain rules

### Money

- API field names use `amountKobo` or explicit `*AmountKobo` names.
- Values must be positive safe integers.
- UI divides by 100 only for formatting.
- Currency is always `NGN` in version 1.
- Delivery amount is always zero.

### Product availability

- Public catalogue exposes active products only.
- Cart rows retain product IDs and quantities; API reads join current product data and may mark a product unavailable.
- Checkout rejects unavailable products and asks the customer to refresh the cart.
- Existing order snapshots remain unchanged after product edits.

### Order statuses

Payment:

- `awaiting_payment`
- `paid`
- `failed`
- `refunded`

Fulfillment:

- `unfulfilled`
- `processing`
- `shipped`
- `delivered`
- `cancelled`

Email:

- `pending`
- `sent`
- `failed`

### Idempotency

- Order creation is idempotent per authenticated user and key.
- Replaying a key returns the original order before validating changed payload data.
- Repeated payment settlement returns the persisted paid order without duplicate effects.
- A mobile payment-session endpoint must be safe to retry and must not create duplicate orders.

## Product states

### Loading

- Use editorial skeleton blocks, not indefinite blank screens.
- Preserve layout dimensions to reduce movement.
- Announce long-running payment verification accessibly.

### Empty

- Catalogue: explain that the collection is temporarily unavailable.
- Cart: prompt to browse the collection.
- Orders: prompt toward a first purchase.

### Offline

- Cached public catalogue may remain readable.
- Cart reads and all cart mutations require connectivity; do not queue offline changes.
- Authentication, checkout, payment verification, and order refresh require connectivity.
- Never infer payment success while offline.

### Error

- Show a stable user action: retry, sign in again, return to cart, or contact support.
- Provider/database details remain in server logs and request IDs.
- Preserve order number when an order exists but payment initialization fails.

## Analytics events

No analytics provider is mandated. Event names and payloads must avoid secrets and unnecessary PII.

| Event                        | Required properties                       |
| ---------------------------- | ----------------------------------------- |
| `catalogue_viewed`           | productCount, source                      |
| `product_viewed`             | productId, slug                           |
| `cart_item_added`            | productId, quantity                       |
| `cart_item_removed`          | productId                                 |
| `cart_viewed`                | lineCount, itemCount, displaySubtotalKobo |
| `sign_in_started`            | sourceScreen                              |
| `sign_in_completed`          | sourceScreen                              |
| `checkout_started`           | lineCount, itemCount                      |
| `checkout_validation_failed` | fieldCodes                                |
| `order_created`              | orderNumber, totalAmountKobo, replayed    |
| `payment_session_started`    | orderNumber                               |
| `payment_return_received`    | orderNumber                               |
| `payment_status_resolved`    | orderNumber, paymentStatus                |
| `order_viewed`               | orderNumber                               |

Never include access tokens, full addresses, phone numbers, email addresses, provider payloads, or service secrets.

## Non-functional requirements

### Performance

- Cached catalogue should render useful content within 1 second on a warm start.
- Interactive controls should respond within 100 ms locally.
- Product images should use responsive dimensions, caching, and placeholders.
- Pagination must avoid loading the entire order history.

### Accessibility

- Minimum touch target: 44 by 44 points.
- Support Dynamic Type without clipping critical actions.
- Meet WCAG AA contrast for text and controls.
- Expose labels, roles, hints, errors, and status changes to screen readers.
- Respect reduced-motion settings.
- Never communicate state through colour alone.

### Security and privacy

- Store Supabase tokens in platform secure storage.
- Never ship service-role, Paystack, Mailgun, or webhook secrets.
- Do not log tokens, provider responses, addresses, phones, or emails.
- Owner-scope all customer resources at the data boundary.
- Validate app links and fixed redirect destinations.
- Use TLS for all production traffic.

## Release criteria

- OpenAPI contract implemented and contract-tested.
- iOS and Android Google OAuth verified with real app links.
- Paystack test-mode checkout, return, webhook, and race behavior verified.
- Paid order persists if the app is killed during payment.
- Mailgun confirmed from a verified domain; sandbox is acceptable only for internal test recipients.
- Order isolation and unauthorized API behavior verified.
- VoiceOver and TalkBack critical journeys pass.
- Small and large phone layouts pass without clipped controls.
- Shared-cart synchronization, sign-out retention, and offline mutation blocking tests pass.
- No production secret appears in the application bundle or logs.
