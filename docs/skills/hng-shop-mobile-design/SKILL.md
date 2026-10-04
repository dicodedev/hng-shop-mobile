---
name: hng-shop-mobile-design
description: Use when designing or implementing HNG Shop customer mobile screens, Expo React Native components, navigation, states, or copy. Applies the HNG Shop editorial system and product invariants.
compatibility: Expo React Native customer app; reference tokens and specifications in docs/mobile-handoff.
metadata:
  product: HNG Shop
  platform: Expo React Native
---

# HNG Shop Mobile Design

Build HNG Shop as a native editorial commerce application for Nigeria. Preserve the established product constraints and visual language rather than generating a generic ecommerce interface.

## Read first

Use these references as the source of truth:

1. `docs/mobile-handoff/PRODUCT_SPEC.md`
2. `docs/mobile-handoff/SCREEN_SPEC.md`
3. `docs/mobile-handoff/DESIGN_SYSTEM.md`
4. `docs/mobile-handoff/tokens/design-tokens.json`
5. `docs/mobile-handoff/api/openapi.yaml`

If product behavior and visual preference conflict, preserve secure product behavior first, then express it using the design system.

## Product invariants

- Nigeria only.
- NGN only, represented as integer kobo.
- Delivery is free within Nigeria.
- Google authentication uses Supabase OAuth PKCE.
- Payment uses hosted Paystack; never collect card details.
- Device prices are display snapshots; the backend confirms totals.
- Use the authenticated Supabase-backed cart; verified settlement removes unchanged ordered lines.
- Customers can read only their own orders.
- Products are active or archived; never invent stock counts.
- Mobile version 1 is customer-only. Do not add admin screens.

## Visual direction

- Warm paper background, near-black text, terracotta accent, moss paid status.
- Large serif display headlines with tight tracking.
- Bold uppercase sans labels with generous tracking.
- Fine borders and negative space instead of card-heavy layouts.
- Product imagery is the dominant catalogue element.
- Buttons are pill-shaped; fields use restrained 8-point radii.
- Use dark ink panels sparingly for checkout emphasis.

Use tokens, never arbitrary close-enough colours. Import or translate values from `design-tokens.json` or `expo-theme.ts`.

## Native implementation rules

- Respect safe areas and native back behavior.
- Minimum touch target is 44 by 44 points.
- Support Dynamic Type without clipping controls or status text.
- Use Expo Router conventions and platform-appropriate sheets/pickers.
- Store auth tokens only in secure storage.
- Never store the cart in AsyncStorage; use the bearer-authenticated cart API and keep only transient render state in memory.
- Subscribe to the owner-scoped `carts` Realtime header and refetch the canonical cart when its version advances.
- Use Expo WebBrowser for Paystack and app/universal links for return navigation.
- Treat deep links as navigation only; fetch payment state from the authenticated API.
- Provide loading, empty, offline, error, disabled, pressed, and success states.
- Respect reduced-motion settings.

## Component recipe

### Screen

- Background: `paper`.
- Horizontal gutter: 20–24 points on phone.
- Start with an eyebrow and one editorial heading when appropriate.
- Use open spacing and horizontal rules to group content.

### Product tile

- Image-first with `4:5`, `5:4`, or `16:10` crop.
- Always show name and formatted NGN price.
- Make the entire tile one accessible action.
- Avoid overlay controls that compete with the image.

### Primary action

- Ink background and paper text.
- Full radius, minimum height 48.
- Uppercase 12-point bold label with wide tracking.
- Accent or accent-dark pressed state.
- Checkout action height: 56.

### Status

- Paid: moss with paper text.
- Failed: accent with paper text.
- Pending/neutral: paperDeep with ink text.
- Always include a textual label.

### Empty or failure state

- Accent eyebrow.
- Display-serif headline.
- Short muted explanation.
- One clear recovery action.
- Never expose HTTP, SQL, Supabase, Paystack, or Mailgun internals.

## Content rules

- Calm, direct, editorial, and reassuring.
- Use `cart`, `sign in`, `collection`, and customer-facing `fulfilment`.
- State delivery as `Complimentary across Nigeria` or equivalent.
- Never use fake urgency or unsupported availability claims.
- Never say payment succeeded until the API returns `paid`.
- Never say email was sent when email status is pending or failed.
- Never say an order is on the way while fulfillment is unfulfilled.

## Accessibility checklist

- Screen has a clear heading.
- Interactive images have meaningful labels.
- Icon-only controls have explicit action labels.
- Errors are linked to fields and announced.
- Status uses text as well as colour.
- Busy states are announced without repeated interruption.
- Layout works at large accessibility text sizes.
- Contrast remains sufficient in disabled and secondary states.

## Avoid

- Generic white cards on a grey app background.
- Default blue actions.
- Excessive shadows, gradients, glassmorphism, and rounded containers.
- Identical product-card geometry across the entire catalogue.
- Tiny icons or hover-derived interactions.
- Client-side payment claims.
- Service-role or provider secrets in the app.
- New product features not present in the product specification.

## Before completing a screen

1. Verify it maps to `SCREEN_SPEC.md`.
2. Use semantic tokens from the token files.
3. Cover loading, empty, error, offline, and accessibility states.
4. Confirm money remains integer kobo outside formatting.
5. Confirm no browser-cookie assumption entered native code.
6. Confirm provider and service secrets remain server-only.
7. Confirm cart mutations are disabled offline and add-to-cart requires sign-in.
