# Authentication, Payments, and Email

## Native authentication

### Target flow

1. Mobile app starts Google OAuth through Supabase with PKCE.
2. Google returns to a configured app/universal link.
3. Supabase SDK exchanges the authorization response.
4. Access and refresh tokens are persisted in platform secure storage.
5. App sends access tokens to the BFF as bearer credentials.
6. BFF validates the token and creates a user-scoped Supabase client.

### Redirect safety

- Configure exact iOS universal-link and Android app-link destinations.
- Use a development custom scheme only for local development.
- Never accept an arbitrary callback or post-auth destination from a query parameter.
- Preserve only an internal route identifier from a small allowlist.
- Do not put tokens into normal navigation URLs.

### Session behavior

- Refresh before expiry through the Supabase SDK.
- On invalid refresh, clear secure session state and return to sign-in.
- Sign-out clears auth tokens but does not delete the Supabase-backed account cart.
- A user is not an administrator merely because they authenticated.

## Order and payment flow

### Create order

The app calls `POST /api/v1/orders` with a bearer token, idempotency header, and delivery fields only. The BFF validates delivery fields, calls `create_order_from_cart`, and maps its database response into a stable DTO. The RPC locks and reads the authenticated user's canonical cart before delegating server-authoritative pricing to `create_order`.

The client never sends:

- Price.
- Product name or image as authority.
- Total.
- Currency.
- Customer email.
- User ID.
- Payment status.
- Product IDs or quantities; order creation reads them from the locked database cart.

### Create payment session

The app calls `POST /api/v1/orders/{orderNumber}/payment-sessions`.

The backend:

- Verifies ownership.
- Verifies the order remains payable.
- Derives customer email, amount, currency, and provider reference.
- Uses a fixed HTTPS provider return URL.
- Returns only a hosted Paystack authorization URL and safe order/session metadata.

### Open Paystack

- Use Expo WebBrowser.
- Never embed or inspect card fields.
- Keep the order number in local payment state.
- App backgrounding or WebBrowser dismissal does not mark payment failed automatically.

### Provider return bridge

Recommended public HTTPS route:

```text
GET /payments/paystack/return?reference=<provider-reference>
```

The backend:

1. Validates reference format.
2. Calls Paystack verification with the server secret.
3. Requires status `success`.
4. Requires exact reference, amount, and `NGN` currency.
5. Calls idempotent service-role settlement.
6. Attempts confirmation only on first transition to paid.
7. Redirects to a fixed app/universal link.

Example navigation redirect:

```text
https://shop.example.com/app/payment-result?orderNumber=HNG-2026-ABCD1234
```

The deep link is not proof of payment. The mobile app fetches `GET /api/v1/orders/{orderNumber}/payment-status` before rendering success, then refetches `GET /api/v1/cart`. First verified settlement has already removed only ordered cart lines whose versions were unchanged since order creation, preserving concurrent edits.

### Webhook

Paystack webhook remains:

```text
POST /api/webhooks/paystack
```

Requirements:

- Read exact raw body.
- Verify HMAC-SHA512 before JSON parsing.
- Use Paystack secret or configured webhook override only on the server.
- Return retryable server error if a valid successful payment cannot be persisted.
- Make callback/webhook races harmless through database row locks and idempotency.

### Payment recovery

- On app foreground, fetch payment status for an unresolved order.
- Poll only while active and within a bounded window.
- If still pending, show `Check again` and `Return to orders`.
- Allow a new hosted attempt only when backend state permits it.
- Never ask the customer to pay again solely because the browser return was missed.

## Email confirmation

Email is a server-side post-payment effect.

Rules:

- Send only after first transition to paid.
- Build from persisted order snapshots.
- Escape customer and product content in HTML.
- Persist `sent` or `failed` independently from payment.
- Never show payment failure because email failed.
- Never put Mailgun credentials in mobile code.

### Sandbox versus production

Mailgun sandbox domains send only to explicitly authorized recipients. They are suitable for internal testing, not customer release.

Production requires:

- Verified custom sending domain.
- Correct DNS records.
- `MAILGUN_FROM_EMAIL` on that domain.
- Correct US/EU API base URL.
- Real delivery verification and bounce monitoring.

### Retry gap

Current behavior makes one immediate attempt. Before production, choose one:

- Durable job/queue with bounded retry and idempotent delivery record.
- Scheduled worker that claims pending/failed rows.
- Admin-only resend action with audit logging.

Do not resend solely because a payment callback is revisited; payment replay returns `newly_paid = false`.

## Required server secrets

- `SUPABASE_SERVICE_ROLE_KEY`
- `PAYSTACK_SECRET_KEY`
- Optional `PAYSTACK_WEBHOOK_SECRET`
- `MAILGUN_API_KEY`
- `MAILGUN_DOMAIN`
- `MAILGUN_FROM_EMAIL`
- Optional `MAILGUN_API_BASE_URL`

These values must never enter Expo public environment variables, source maps, logs, analytics, or OTA bundles.
