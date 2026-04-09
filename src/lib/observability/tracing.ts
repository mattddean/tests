import * as EffectOtelTracer from "@effect/opentelemetry/Tracer";
import { SpanStatusCode, trace, type Attributes, type Span } from "@opentelemetry/api";
import { Effect } from "effect";

const requestIds = new WeakMap<Request, string>();

export const OBSERVABILITY_SERVICE_NAME = "field-notes";

export type RequestTraceDetails = {
  readonly headers: Headers;
  readonly requestId: string;
  readonly method: string;
  readonly pathname: string;
};

export function getOrCreateRequestId(request: Request): string {
  const existing = requestIds.get(request);
  if (existing) {
    return existing;
  }

  const requestId =
    request.headers.get("x-request-id") ??
    request.headers.get("X-Request-Id") ??
    crypto.randomUUID();

  requestIds.set(request, requestId);
  return requestId;
}

export function getRequestTraceDetails(request: Request): RequestTraceDetails {
  const url = new URL(request.url);

  return {
    headers: request.headers,
    requestId: getOrCreateRequestId(request),
    method: request.method.toUpperCase(),
    pathname: url.pathname,
  };
}

export function getActiveSpanContext() {
  return trace.getActiveSpan()?.spanContext();
}

export function withActiveSpanContext<A, E, R>(
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<A, E, R> {
  const spanContext = getActiveSpanContext();
  return spanContext ? effect.pipe(EffectOtelTracer.withSpanContext(spanContext)) : effect;
}

export function setSpanAttributes(span: Span, attributes: Attributes): void {
  for (const [key, value] of Object.entries(attributes)) {
    if (value !== undefined) {
      span.setAttribute(key, value);
    }
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unexpected server error";
}

export function getErrorType(error: unknown): string {
  if (error instanceof Error) {
    return error.name;
  }

  if (error && typeof error === "object" && "_tag" in error && typeof error._tag === "string") {
    return error._tag;
  }

  return "UnknownError";
}

export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(getErrorMessage(error));
}

export function markSpanAsError(span: Span, error: unknown, attributes: Attributes = {}): void {
  span.recordException(toError(error));
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: getErrorMessage(error),
  });
  setSpanAttributes(span, {
    "error.type": getErrorType(error),
    "error.message": getErrorMessage(error),
    ...attributes,
  });
}

export function annotateCurrentEffectSpan(attributes: Attributes): Effect.Effect<void> {
  return Effect.forEach(
    Object.entries(attributes),
    ([key, value]) => (value === undefined ? Effect.void : Effect.annotateCurrentSpan(key, value)),
    { discard: true },
  );
}

export function markCurrentEffectSpanAsError(
  error: unknown,
  attributes: Attributes = {},
): Effect.Effect<void> {
  return Effect.catchAll(
    Effect.flatMap(EffectOtelTracer.currentOtelSpan, (span) =>
      Effect.sync(() => {
        markSpanAsError(span, error, attributes);
      }),
    ),
    () => Effect.void,
  );
}
