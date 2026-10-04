# Mobile Requirement Traceability Matrix

| ID      | Requirement                                   | Screen                        | API/data control                         | Security control                        | Required tests                       |
| ------- | --------------------------------------------- | ----------------------------- | ---------------------------------------- | --------------------------------------- | ------------------------------------ |
| CAT-01  | List active products                          | Shop                          | `GET /products`                          | Public DTO exposes active only          | Public catalogue, archived exclusion |
| CAT-02  | View active product                           | Product detail                | `GET /products/{slug}`                   | Missing/archived both `404`             | Detail success/not-found             |
| CART-01 | Persist account cart                          | Cart                          | `GET /cart`, Supabase cart tables        | Bearer auth, owner-scoped RPCs          | Restart, sign-out/in, cross-device   |
| CART-02 | Enforce cart limits                           | Product, Cart                 | RPC-backed cart mutations                | Server enforces quantity/line limits    | 50 lines, quantity 1/99              |
| CART-03 | Synchronize live cart                         | Product, Cart, tab badge      | Owner `carts` Realtime + API refetch     | Header-only RLS; no line subscription   | Two clients, stale/version ordering  |
| CART-04 | Require sign-in and connectivity              | Product, Cart                 | `401`; no offline mutation queue         | No anonymous cart access                | Signed-out add, offline mutation     |
| AUTH-01 | Google sign-in                                | Sign in                       | Supabase OAuth PKCE                      | Secure storage, fixed redirect          | iOS/Android OAuth and cancel         |
| AUTH-02 | Restore intended route                        | Sign in                       | Allowlisted route identifier             | Reject external destinations            | Malicious return target              |
| PROF-01 | Show account identity                         | Account                       | `GET /me`                                | Bearer auth, own profile                | Unauthorized and success             |
| ORD-01  | Create order from canonical cart              | Checkout                      | `POST /orders`, `create_order_from_cart` | Bearer auth, locked DB cart             | Injected items, inactive item        |
| ORD-02  | Idempotent retry                              | Checkout                      | `Idempotency-Key`                        | Per-user advisory lock/unique key       | Timeout and changed replay           |
| PAY-01  | Start hosted payment                          | Checkout                      | `POST /orders/{id}/payment-sessions`     | Server derives amount/reference/email   | Ownership and provider failure       |
| PAY-02  | Verify payment server-side                    | Payment processing            | Paystack return bridge and webhook       | HMAC/API verification, service role     | Amount/currency/reference mismatch   |
| PAY-03  | Survive callback/webhook race                 | Payment processing            | `mark_order_paid`                        | Row locks and `newly_paid`              | Concurrent/repeated settlement       |
| PAY-04  | Remove only unchanged paid-order lines        | Payment success               | Settlement plus `GET /cart` refetch      | Version match preserves concurrent edit | Fake link, pending, concurrent edit  |
| PAY-05  | Recover after app termination                 | Payment processing            | Payment-status polling                   | Webhook remains authoritative           | Kill/reopen during payment           |
| ORD-03  | List owned orders                             | Orders                        | `GET /orders`                            | Owner scope and private cache           | Cross-user isolation, pagination     |
| ORD-04  | View owned order                              | Order detail                  | `GET /orders/{orderNumber}`              | Missing/non-owned both `404`            | Ownership enumeration                |
| ORD-05  | Preserve purchase snapshots                   | Order detail                  | Order item snapshots                     | Immutable persisted data                | Product edit after order             |
| MAIL-01 | Send confirmation after first paid transition | Payment backend               | Mailgun and email-delivery RPC           | Server-only secret, `newly_paid`        | One attempt, replay                  |
| MAIL-02 | Keep email separate from payment              | Payment success, Order detail | Email status                             | Failure cannot alter paid order         | Mailgun failure                      |
| OFF-01  | Read cached catalogue offline                 | Shop, Product                 | Persisted public cache                   | No stale payment inference              | Offline launch                       |
| OFF-02  | Block cart mutation offline                   | Cart                          | Disabled API mutation                    | No queued or stale write replay         | Offline controls and reconnect       |
| A11Y-01 | Operate critical journey with screen reader   | All                           | Native accessibility props               | Text statuses and field associations    | VoiceOver/TalkBack                   |
| A11Y-02 | Support large text and touch targets          | All                           | Design tokens                            | 44-point minimum                        | Dynamic Type layouts                 |
| SEC-01  | Keep server secrets out of app                | Build/runtime                 | BFF owns provider clients                | Bundle/log inspection                   | Secret scanning                      |
| OBS-01  | Correlate failures safely                     | Error states                  | Problem `requestId`                      | No PII/token logging                    | Error contract/log redaction         |

## Coverage rule

Every new mobile requirement must add or update:

1. A product requirement.
2. A screen or background behavior.
3. An API/data contract where applicable.
4. A security/authorization rule.
5. At least one automated or manual verification case.
