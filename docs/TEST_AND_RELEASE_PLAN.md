# Mobile Test and Release Plan

## Test layers

### Unit

- Cart API-response validation, limits, totals, and version handling.
- Nigerian phone normalization.
- Complete Nigerian region list including FCT.
- Postal-code validation.
- Money formatting without floating-point authority.
- Deep-link parsing and destination allowlisting.
- API error normalization.
- Payment polling state machine.
- Token redaction from logs.
- Design token and theme consistency.

### Component

- Product tile and image loading.
- Add-to-cart disabled and announcement states.
- Quantity stepper at 1 and 99.
- Checkout fields and associated errors.
- Status pills with textual labels.
- Order summary and email failure notice.
- Dynamic Type and screen-reader labels.
- Offline-disabled mutation, empty, loading, and failure states.

### API contract

- Validate server responses against `openapi.yaml`.
- Verify required authentication per operation.
- Verify standard problem shape and stable codes.
- Verify idempotent order replay.
- Verify missing and non-owned order both return `404`.
- Verify server ignores/rejects browser-supplied monetary authority.
- Verify cache headers on customer data.
- Verify cursors are opaque and bounded.
- Verify cart routes require auth, accept bearer tokens, and return joined current product data.
- Verify order creation rejects client cart lines and reads the canonical cart.

### Database/RLS

- Apply all migrations and seed to a clean Supabase-like database.
- Public reads expose active products only.
- Customer order reads remain owner-scoped.
- Profile role escalation is denied.
- Order totals use current products.
- Inactive, missing, duplicate, malformed, and excessive items fail.
- Settlement validates reference, amount, and currency.
- Repeated settlement returns `newly_paid = false`.
- Unpaid fulfillment changes fail.
- Private order-detail function is not directly executable.
- Cart headers and lines remain owner-scoped; direct cart-item access is denied.
- Cart RPCs enforce 50 lines and quantities from 1 through 99.
- Cart-backed order creation locks the canonical cart and records item versions.
- First settlement removes unchanged ordered lines but preserves concurrent edits.

### Integration

- Google OAuth PKCE on iOS and Android.
- Secure session persistence and refresh.
- App/universal link routing from terminated and background states.
- Hosted Paystack opening and cancellation.
- Paystack return followed by API status verification.
- Webhook-only settlement while app is closed.
- Callback/webhook race.
- App killed during hosted payment.
- Payment-provider timeout after order creation.
- Mailgun sent/failed persistence.
- Owner-scoped cart-header Realtime update followed by canonical API refetch across two clients.
- Sign-out and sign-in preserve the account cart without device persistence.

### End-to-end critical paths

1. Fresh install → browse → tap add → sign in → add → checkout → pay → order detail.
2. Existing session → cart → payment → app killed → reopen → paid status resolves.
3. Payment cancelled → pending/failed state → retry safely.
4. Product archived after entering cart → checkout explains unavailable product.
5. Offline cached catalogue → cart mutation is disabled → reconnect refetches canonical cart.
6. Order belonging to another account → indistinguishable `404`.

## Accessibility matrix

- VoiceOver on latest supported iOS.
- TalkBack on latest supported Android.
- Large and largest accessibility text sizes.
- Reduced motion.
- High contrast/colour differentiation review.
- Switch/keyboard navigation where platform supports it.
- Checkout validation and payment processing announcements.

## Device matrix

Minimum recommended manual coverage:

- Small iPhone form factor.
- Current standard iPhone.
- Large iPhone.
- Small Android phone.
- Current mid-range Android.
- Large Android phone.
- Tablet layout sanity check if tablets are declared supported.

Test at least one constrained network and one offline transition.

## External-service verification

### Supabase

- Mobile Google redirect allowlist.
- Session refresh.
- RLS against the target hosted project.
- Storage image reads.
- Shared-cart migration, owner-scoped Realtime publication, and bearer cart access.

### Paystack

- Test-mode card success and failure.
- Bank/USSD channel launch where available.
- Signed webhook delivery.
- Return link from hosted checkout.
- Amount/currency mismatch rejection.
- Repeated webhook/callback behavior.

### Mailgun

- Authorized-recipient delivery for sandbox development.
- Verified custom-domain delivery before production.
- Correct US/EU endpoint.
- Failed provider response persists without changing payment.

## Release environments

### Development

- Development Supabase project.
- Paystack test key.
- Mailgun sandbox with authorized recipients.
- Custom scheme allowed for local Expo development.

### Staging

- Separate Supabase project where practical.
- Paystack test key and publicly reachable webhook.
- Verified staging Mailgun domain or controlled recipients.
- Real iOS/Android app links.

### Production

- Production Supabase and database migrations.
- Paystack live key and webhook.
- Verified Mailgun domain.
- Canonical HTTPS origin.
- Production app-link association files.
- Monitoring, request IDs, and alerting enabled.

## Release gate

- Formatting, lint, type checking, unit, component, and contract tests pass.
- OpenAPI client generation is reproducible.
- No secret appears in bundle inspection, source maps, logs, or Expo configuration.
- Database migrations and RLS tests pass against staging.
- OAuth works from installed iOS and Android builds.
- Paystack success, failure, cancellation, webhook-only, and race scenarios pass.
- Paid status survives app termination.
- Paid settlement removes only unchanged ordered cart lines; clients refetch and preserve concurrent edits.
- Mailgun sends from a verified domain or release is blocked.
- VoiceOver and TalkBack critical journeys pass.
- Support team can reconcile an issue using order number and request ID.

## Existing verification inherited from web

The web repository has unit/provider coverage and PGlite database workflow coverage. It does not replace native OAuth, app-link, device, API contract, or hosted provider E2E testing.
