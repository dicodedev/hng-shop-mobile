# HNG Shop Mobile Screen Specification

## Navigation model

Recommended Expo Router structure:

```text
app/
├── _layout.tsx
├── (tabs)/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── cart.tsx
│   ├── orders.tsx
│   └── account.tsx
├── product/[slug].tsx
├── checkout/index.tsx
├── payment/processing.tsx
├── payment/result.tsx
├── order/[orderNumber].tsx
├── auth/sign-in.tsx
└── +not-found.tsx
```

Bottom tabs:

- Shop
- Cart, with item-count badge
- Orders
- Account

Product, checkout, payment, sign-in, and order detail are stack screens. The app must preserve the intended destination across authentication without accepting arbitrary external paths.

## Global shell

- Respect top and bottom safe areas.
- Use paper background and ink text.
- Use a text wordmark; no committed logo asset currently exists.
- Use native back behavior on stack screens.
- Keep bottom navigation visible only on primary tabs.
- Show network/offline state; cached catalogue may remain available, but cart access requires the canonical API.

## Shop

### Purpose

Introduce the brand and display active products.

### Content

- Eyebrow: `The collection`
- Editorial headline: `Objects for living well.`
- Supporting copy about modern Nigerian life.
- Active product list.

### Layout

- Large display headline at the top.
- Native two-column editorial grid on sufficiently wide phones; one column on narrow devices or when Dynamic Type requires it.
- Alternate portrait and landscape-feeling crops without creating unusably short touch targets.

### Data

- `GET /api/v1/products`
- Cache successful pages for offline reading.

### States

- Initial skeleton.
- Pull-to-refresh.
- Cached/offline indicator.
- Empty collection state.
- Recoverable network error.

### Analytics

- `catalogue_viewed`
- `product_viewed` when a product is selected

## Product detail

### Purpose

Present one product and add it to the cart.

### Content

- Hero image.
- Name.
- Formatted NGN price.
- Full description.
- `Complimentary delivery across Nigeria`.
- `Priced in Nigerian naira`.
- Add-to-cart action.

### Behavior

- Add one unit or increment existing line.
- If signed out, route to Google sign-in before attempting the add.
- Disable at quantity 99.
- Announce successful addition.
- Show not-found state for missing or archived products.

### Data

- `GET /api/v1/products/{slug}`
- `POST /api/v1/cart/items` after authentication

## Cart

### Purpose

Manage the authenticated account cart shared across web and mobile.

### Content

- Item image, name, unit price, quantity, and line subtotal.
- Increment, decrement, and remove controls.
- Display subtotal.
- Free-delivery note.
- Checkout action.

### Behavior

- Require sign-in before loading the cart.
- Fetch `GET /api/v1/cart` and render its joined current product data.
- Decrement one removes the line.
- Clear cart requires confirmation when non-empty.
- Send mutations immediately through the cart API; disable them offline rather than queueing changes.
- Subscribe to the owner-scoped `public.carts` header and refetch `GET /api/v1/cart` when its version advances.
- Explain that final prices are confirmed by the server.

### States

- API loading skeleton.
- Empty cart editorial state.
- Offline/error state with retry and disabled mutation controls.

### Data

- `GET`/`DELETE /api/v1/cart`
- `POST /api/v1/cart/items`
- `PATCH`/`DELETE /api/v1/cart/items/{productId}`

## Sign in

### Purpose

Authenticate through Google and return to the protected journey.

### Content

- Brand statement.
- `Continue with Google` action.
- Short privacy/trust explanation.

### Behavior

- Launch Supabase OAuth PKCE.
- Use allowlisted app/universal link.
- Store session in platform secure storage.
- Restore intended destination.
- Show actionable cancellation and provider errors.

## Checkout

### Purpose

Collect delivery details and create a server-priced order.

### Fields

- Full name.
- Phone.
- Address line 1.
- Optional address line 2 or landmark.
- City.
- State/FCT picker.
- Postal code.

### Summary

- Product image, name, quantity, and display subtotal.
- Total labelled as server-confirmed after submission.
- Complimentary delivery.

### Behavior

- Normalize local Nigerian phone formats to E.164.
- Validate on blur and submission.
- Disable duplicate submission.
- Generate and retain an idempotency UUID for retries.
- On order success, request a payment session.
- Preserve order number if payment initialization fails.

### Data

- `POST /api/v1/orders`
- `POST /api/v1/orders/{orderNumber}/payment-sessions`

## Payment processing

### Purpose

Bridge hosted Paystack checkout and authoritative app status.

### Behavior

1. Open Paystack authorization URL with Expo WebBrowser.
2. Accept navigation only through configured app/universal links.
3. Extract order number only for navigation.
4. Fetch authenticated payment status.
5. Poll with backoff while `awaiting_payment` for a bounded duration.
6. Refresh when the app returns to the foreground.

### Copy

- `Confirming your payment` while status is unresolved.
- Do not say payment succeeded based on deep-link parameters.

### Data

- `GET /api/v1/orders/{orderNumber}/payment-status`

## Payment success

### Purpose

Confirm persisted payment and route to order detail.

### Behavior

- Render only after API status is `paid`.
- Refetch the canonical cart after paid status; settlement has already removed only unchanged ordered lines.
- Show order number and persisted total.
- Do not claim fulfillment has started unless its status supports that statement.
- If email status is failed, state that payment is confirmed but email delivery failed.

## Payment problem

### Variants

- Payment still pending.
- Payment failed.
- Verification temporarily unavailable.
- Saved order but payment session unavailable.

### Actions

- Check again.
- Retry payment when eligible.
- View order.
- Return to cart.
- Contact support with order number.

## Orders

### Purpose

Display customer-owned order history.

### List row

- Order number.
- Date.
- Total.
- Payment status.
- Fulfillment status.

### Behavior

- Cursor pagination.
- Pull-to-refresh.
- Empty state for first-time customers.
- Sign-in required.

### Data

- `GET /api/v1/orders`

## Order detail

### Content

- Order number and creation date.
- Payment and fulfillment status pills.
- Immutable item snapshots.
- Quantity, unit price, and line total.
- Subtotal, free delivery, and total.
- Delivery address and phone.
- Email delivery warning when failed.

### Behavior

- Sign-in required.
- Missing and non-owned orders share the same not-found state.
- Pending/failed payment exposes payment recovery when allowed.

### Data

- `GET /api/v1/orders/{orderNumber}`

## Account

### Content

- Customer name.
- Email.
- Avatar when available.
- Links to Orders and Shop.
- Sign-out action.

### Behavior

- Sign-in required for profile content.
- Sign-out clears secure session state but leaves the canonical cart in the account.
- No profile editing or role mutation in version 1.

### Data

- `GET /api/v1/me`

## Native not-found and fatal error

- Preserve the editorial visual language.
- Avoid provider/database terminology.
- Offer navigation to Shop or a retry action.
- Fatal errors must not delete the account cart or secure session state automatically.

## Accessibility requirements by screen

- Provide a single logical heading for each screen.
- Ensure image alt labels add information rather than repeating adjacent names.
- Quantity buttons include product name and resulting action.
- Validation errors associate with fields and announce once.
- Status pills expose full text.
- Payment processing uses a live-region equivalent but does not repeatedly interrupt screen readers.
- Bottom-tab badges expose the numeric cart count.
