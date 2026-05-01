# @vibly/coordinator-http-contract

Single source of truth for the Vibly Coordinator HTTP/SSE contract, consumed by `vibly-client` and `vibly-console`.

The contract is **derived from `vibly-coordinator`** at build time:

```
vibly-coordinator (Fastify routes with @fastify/swagger)
        │ pnpm --filter vibly-coordinator dump:openapi
        ▼
@vibly/coordinator-http-contract/openapi.json
        │ pnpm --filter @vibly/coordinator-http-contract gen
        ▼
src/generated/types.ts        ← openapi-typescript output
src/client.ts / src/sse.ts    ← thin transport-agnostic wrappers
```

## What this package exposes

- `openapi.json` — committed artifact, regenerated from coordinator routes; CI gates drift.
- `src/generated/types.ts` — generated `paths` / `components` for openapi-fetch typing.
- `src/client.ts` — `createCoordinatorClient({ baseUrl, fetch, headers })` based on `openapi-fetch` with envelope unwrap and `CoordinatorApiError`.
- `src/sse.ts` — typed Server-Sent Events helpers (event names re-exported from generated types where possible).

## What this package does NOT contain

- Fastify, React, Commander, or any UI/CLI/server framework.
- Authentication policy or transport choices (CORS proxy vs direct). Those live in consumers.
- Endpoints not yet covered by `schema.response` in coordinator. Until coordinator adds the response schema for a route, openapi-fetch cannot strongly type its response, and consumers should keep their handwritten path until the route is migrated.

## Consumers

- `vibly-client` — Node CLI; adds `Authorization: Bearer`, retries, timeouts, idempotency keys.
- `vibly-console` — Next.js Web UI; chooses direct vs proxy URL building and uses React Query on top.

Both must consume only this package's exported types and `client.ts`. Handwritten path strings are not allowed (lint rule lives in each consumer).
