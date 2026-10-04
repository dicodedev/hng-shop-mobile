# HNG Shop Mobile

Expo React Native customer application for HNG Shop. Milestone one implements the public catalogue and product detail experience against the deployed mobile BFF, with explicit development fixtures for offline work.

## Commands

- `pnpm start` starts Expo.
- `pnpm ios`, `pnpm android`, and `pnpm web` open a target platform.
- `pnpm generate:api` regenerates API types from `docs/api/openapi.yaml`.
- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, and `pnpm test` run offline verification.
- `pnpm test:contract` probes the deployed BFF with real HTTP.
- `pnpm export` creates static platform bundles.

## Environment

`EXPO_PUBLIC_API_URL` is the versioned BFF origin. `EXPO_PUBLIC_CATALOGUE_SOURCE` must be `fixtures` or `api`. Development defaults to fixtures; release builds default to the API and never fall back to fixture products after a request failure.

Only Expo-public, non-secret values belong in this application. Supabase service-role, Paystack, Mailgun, and database secrets must remain on the backend.

## Deployed backend status

All fifteen contract operations are live as of 2026-10-03. Run `pnpm test:contract`
after any backend deployment; it probes the catalogue, profile, cart, order, payment,
and return-bridge routes and fails on drift.

Retain the transport rule that rejects non-JSON success bodies. A route that falls
through to the web application can answer `200 text/html`, so a status code alone is
never sufficient evidence of a valid response.

## Release checklist

- Replace the placeholder bundle identifiers and development scheme.
- Create a development build. OAuth with a custom scheme cannot work in Expo Go.
- Register the resolved OAuth redirect in the Supabase Auth allowlist.
- Move to universal/app links before store submission.
