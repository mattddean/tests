import { getRequest } from "@tanstack/react-start/server";
import { Cause, Effect } from "effect";

import { mapToTransportError } from "@/server/errors/error-mapper";
import {
  capturePostHogServerException,
  extractPostHogCorrelationFromHeaders,
} from "@/server/observability/posthog-server";
import {
  annotateCurrentEffectSpan,
  getErrorType,
  getRequestTraceDetails,
  markCurrentEffectSpanAsError,
  toError,
  withActiveSpanContext,
} from "@/server/observability/tracing";

import { makeRequestLayer } from "./request-context";
import { rootRuntime } from "./root-runtime";

function unwrapEffectCause(error: unknown): unknown {
  if (!error || typeof error !== "object") {
    return error;
  }

  if ("cause" in error && error.cause) {
    return unwrapEffectCause(error.cause);
  }

  return error;
}

export async function runServerEffect<A, E, R>(
  program: Effect.Effect<A, E, R>,
  options: {
    readonly name: string;
  },
) {
  const request = getRequest();
  const requestDetails = getRequestTraceDetails(request);
  const operationName = options.name;
  // Request-scoped values are created fresh on each call and provided on top of
  // the shared rootRuntime. That keeps headers/session/user isolated per request
  // while still reusing long-lived services from RootLayer.
  const requestLayer = makeRequestLayer(requestDetails);
  const correlation = extractPostHogCorrelationFromHeaders(request.headers);

  const instrumentedProgram = withActiveSpanContext(
    Effect.gen(function* () {
      yield* annotateCurrentEffectSpan({
        "app.request_id": requestDetails.requestId,
        "http.method": requestDetails.method,
        "url.path": requestDetails.pathname,
        "app.operation": operationName,
      });

      return yield* program;
    }).pipe(
      Effect.withSpan(operationName, {
        kind: "server",
      }),
      Effect.catchAllCause((cause) => {
        const error = unwrapEffectCause(Cause.squash(cause));
        const transportError = mapToTransportError(error);

        return Effect.gen(function* () {
          yield* annotateCurrentEffectSpan({
            "error.type": getErrorType(error),
            "error.message": transportError.message,
            "app.transport_error_code": transportError.code,
            "http.response.status_code": transportError.status,
          });
          yield* markCurrentEffectSpanAsError(error, {
            "app.transport_error_code": transportError.code,
            "http.response.status_code": transportError.status,
          });
          yield* Effect.sync(() =>
            capturePostHogServerException(
              toError(error),
              {
                request_id: requestDetails.requestId,
                http_method: requestDetails.method,
                url_path: requestDetails.pathname,
                operation: operationName,
                transport_error_code: transportError.code,
                response_status_code: transportError.status,
              },
              correlation,
            ),
          );
          return yield* Effect.fail(transportError);
        });
      }),
    ),
  );

  return await rootRuntime.runPromise(
    instrumentedProgram.pipe(Effect.provide(requestLayer)) as Effect.Effect<A, E, never>,
  );
}
