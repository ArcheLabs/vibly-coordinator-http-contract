# @vibly-ai/coordinator-http-contract

Single source of truth for the Vibly Coordinator HTTP and SSE contract, consumed by `@vibly-ai/client` and `vibly-console`.

The contract is derived from `vibly-coordinator` at build time:

```
vibly-coordinator (Fastify routes with @fastify/swagger)
        |  pnpm --filter vibly-coordinator dump:openapi
        v
@vibly-ai/coordinator-http-contract/openapi.json
        |  pnpm --filter @vibly-ai/coordinator-http-contract gen
        v
src/generated/types.ts        <- openapi-typescript output
src/client.ts / src/sse.ts    <- thin transport-agnostic wrappers
```

## What this package exposes

- `openapi.json` — committed artifact, regenerated from coordinator routes; CI gates drift.
- `src/generated/types.ts` — generated `paths` and `components` for `openapi-fetch` typing.
- `src/client.ts` — `createCoordinatorClient({ baseUrl, fetch, headers })` with envelope unwrap and `CoordinatorApiError`.
- `src/sse.ts` — typed SSE helpers for both project and global streams.

## Version policy surface

This package now includes typed support for coordinator compatibility policy and daemon operations:

- `GET /version-policy` for minimum and recommended client versions.
- `POST /agents/{id}/heartbeat` for daemon heartbeat and upgrade phase reporting.
- Typed `UPGRADE_REQUIRED` error envelopes surfaced through `CoordinatorApiError`.
- SSE helpers aligned with the live coordinator routes:
  `projectEventStreamUrl()` -> `/projects/:projectId/stream`
  `globalEventStreamUrl()` -> `/streams/events`

Consumers are expected to attach these headers on protected requests:

- `X-Vibly-Client-Package`
- `X-Vibly-Client-Version`
- `X-Vibly-Contract-Version`
- `X-Vibly-Protocol-Version`

## What this package does not contain

- Fastify, React, Commander, or any UI, CLI, or server framework.
- Authentication policy or transport choices. Those live in consumers.
- Consumer-specific retry, timeout, idempotency, or process-management logic.

## Consumers

- `@vibly-ai/client` — Node CLI and daemon; adds authorization, retries, idempotency, version headers, and upgrade logic.
- `vibly-console` — Web UI; chooses direct vs proxy URL building and uses its own data-fetching layer on top.

Both must consume only this package's exported types and client helpers. Handwritten path strings are not allowed.

## Development

```bash
pnpm gen
pnpm lint
pnpm build
```
