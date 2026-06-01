/**
 * Typed Server-Sent Events helpers for the Coordinator project event stream.
 *
 * Coordinator publishes project domain events on `/projects/:projectId/stream` and global streams on `/streams/events`.
 * the Fastify SSE plugin. The event payload is the full Concord event
 * envelope; consumers care about the `type` discriminator plus the
 * `payload` shape per event type.
 *
 * For now we only commit a minimal event-name typing surface. The richer
 * payload schemas should land in openapi.json once coordinator declares the
 * SSE event message shape (e.g. via a Streaming description).
 */

export type CoordinatorEventName =
  | "ProjectCreated"
  | "ProjectActivated"
  | "ProjectPaused"
  | "ProjectArchived"
  | "WorkOrderCreated"
  | "WorkOrderClaimed"
  | "WorkOrderSubmitted"
  | "WorkOrderCancelled"
  | "ReviewSubmitted"
  | "ReviewAggregated"
  | "TraceCreated"
  | "PhaseGTimelineUpdated"
  | "PhaseFSmokeCompleted"
  | "PhaseHTimelineUpdated"
  | (string & {});

export interface CoordinatorEventEnvelope<TType extends CoordinatorEventName = CoordinatorEventName> {
  id: string;
  type: TType;
  payload: unknown;
  occurredAt?: string;
  correlationId?: string;
  causationId?: string;
}

export interface SseHandlers {
  onEvent: (event: CoordinatorEventEnvelope) => void;
  onStatus?: (status: "connected" | "disconnected" | "error") => void;
}

export interface SseOptions {
  baseUrl: string;
  /** Constructor for EventSource; provided by browser, by `eventsource-parser` in Node, or polyfilled. */
  EventSourceCtor?: typeof EventSource;
  /** Optional query params (e.g. apiToken for proxy mode). */
  query?: Record<string, string | undefined>;
}

/**
 * Build the URL the project event stream should be opened against.
 * Caller decides how to construct the EventSource (browser native, polyfill,
 * or fetch-based parser for Node CLIs).
 */
export function projectEventStreamUrl(opts: SseOptions, projectId: string): string {
  const url = new URL(`/projects/${projectId}/stream`, opts.baseUrl);
  for (const [key, value] of Object.entries(opts.query ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, value);
  }
  return url.toString();
}


export function globalEventStreamUrl(opts: SseOptions): string {
  const url = new URL("/streams/events", opts.baseUrl);
  for (const [key, value] of Object.entries(opts.query ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, value);
  }
  return url.toString();
}
