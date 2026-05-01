import createOpenApiClient, { type Client, type Middleware } from "openapi-fetch";
import { CoordinatorApiError } from "./errors.js";
import type { paths } from "./generated/types.js";

export interface CoordinatorClientOptions {
  baseUrl: string;
  /** Overrides the global fetch; used by Node CLI and tests. */
  fetch?: typeof fetch;
  /** Static headers (e.g. Authorization). Per-call headers override these. */
  headers?: Record<string, string>;
}

/**
 * Coordinator HTTP client surface. We re-export the openapi-fetch `Client`
 * specialized to the coordinator paths so consumers do not need to install
 * `openapi-fetch` themselves to type the return value.
 */
export type CoordinatorClient = Client<paths>;

interface CoordinatorEnvelope {
  ok: boolean;
  data?: unknown;
  page?: { limit: number; nextCursor: string | null };
  error?: { code?: string; message?: string; details?: unknown };
}

const envelopeMiddleware: Middleware = {
  async onResponse({ response }) {
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return undefined;

    let payload: CoordinatorEnvelope | undefined;
    try {
      payload = (await response.clone().json()) as CoordinatorEnvelope;
    } catch {
      return undefined;
    }
    if (!payload || typeof payload !== "object") return undefined;
    if (payload.ok !== false) return undefined;

    throw new CoordinatorApiError({
      status: response.status,
      code: payload.error?.code,
      message: payload.error?.message ?? `Coordinator responded with HTTP ${response.status}`,
      details: payload.error?.details,
    });
  },
};

export function createCoordinatorClient(options: CoordinatorClientOptions): CoordinatorClient {
  const init: Parameters<typeof createOpenApiClient<paths>>[0] = {
    baseUrl: options.baseUrl,
    headers: options.headers,
  };
  if (options.fetch) init.fetch = options.fetch;
  const client = createOpenApiClient<paths>(init);
  client.use(envelopeMiddleware);
  return client;
}

/**
 * Helper for unwrapping the `{ ok: true, data: ... }` envelope after
 * a successful openapi-fetch response. Throws if the response body is
 * not a coordinator envelope or if `ok` is false.
 */
export function unwrapEnvelope<T>(payload: unknown): T {
  if (!payload || typeof payload !== "object") {
    throw new CoordinatorApiError({
      status: 0,
      message: "Coordinator response is not a JSON envelope",
    });
  }
  const envelope = payload as CoordinatorEnvelope;
  if (envelope.ok === false) {
    throw new CoordinatorApiError({
      status: 0,
      code: envelope.error?.code,
      message: envelope.error?.message ?? "Coordinator returned ok=false",
      details: envelope.error?.details,
    });
  }
  if (envelope.ok !== true) return payload as T;
  return envelope.data as T;
}

export interface ListPage<T> {
  data: T[];
  page: { limit: number; nextCursor: string | null };
}

/**
 * Unwraps a list envelope `{ ok: true, data: T[], page }` into a
 * `{ data, page }` pair. Falls back to a synthetic page if missing.
 */
export function unwrapListEnvelope<T>(payload: unknown): ListPage<T> {
  const data = unwrapEnvelope<T[]>(payload);
  const envelope = payload as CoordinatorEnvelope;
  const items = Array.isArray(data) ? data : [];
  return {
    data: items,
    page: envelope.page ?? { limit: items.length, nextCursor: null },
  };
}
