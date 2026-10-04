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

Verified against `https://hng-shop-task.vercel.app` on 2026-10-03:

- `GET /api/v1/products` and `GET /api/v1/products/{slug}` are live and contract compliant.
- `GET /api/v1/me` is live and returns `application/problem+json` when unauthenticated.
- The `/api/v1/cart` routes exist and require authentication.
- The `/api/v1/orders*` family is not deployed; those paths fall through to the web app and can answer `200 text/html`. The transport client rejects non-JSON success bodies so a web page can never be parsed as order data.

Run `pnpm test:contract` after backend deployments to detect drift.
