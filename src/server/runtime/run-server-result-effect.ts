import { Cause, Effect } from "effect";

import { serverError, serverOk, type ServerResult } from "@/lib/server-result";
import { classifyServerError } from "@/server/errors/error-mapper";
import {
  capturePostHogServerException,
  extractPostHogCorrelationFromRequest,
} from "@/server/observability/posthog-server";
import {
  annotateCurrentEffectSpan,
  getErrorType,
  markCurrentEffectSpanAsError,
  toError,
  withActiveSpanContext,
} from "@/server/observability/tracing";

import { CurrentRequest, RequestContext, makeRequestLayer } from "./request-context";
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

export async function runServerResultEffect<A, E, R>(
  program: Effect.Effect<A, E, R>,
  options: {
    readonly name: string;
  },
): Promise<ServerResult<A>> {
  const operationName = options.name;
  const requestLayer = makeRequestLayer();

  const instrumentedProgram = withActiveSpanContext(
    Effect.gen(function* () {
      const requestContext = yield* RequestContext;

      yield* annotateCurrentEffectSpan({
        "app.request_id": requestContext.requestId,
        "http.method": requestContext.method,
        "url.path": requestContext.pathname,
        "app.operation": operationName,
      });

      return serverOk(yield* program);
    }).pipe(
      Effect.withSpan(operationName, {
        kind: "server",
      }),
      Effect.catchAllCause((cause) => {
        const error = unwrapEffectCause(Cause.squash(cause));
        const classifiedError = classifyServerError(error);

        return Effect.gen(function* () {
          const request = yield* CurrentRequest;
          const requestContext = yield* RequestContext;
          const correlation = extractPostHogCorrelationFromRequest(request);

          yield* annotateCurrentEffectSpan({
            "error.type": getErrorType(error),
            "error.message": classifiedError.error.message,
            "app.transport_error_code": classifiedError.error._tag,
            "http.response.status_code": classifiedError.error.status,
          });
          yield* markCurrentEffectSpanAsError(error, {
            "app.transport_error_code": classifiedError.error._tag,
            "http.response.status_code": classifiedError.error.status,
          });

          if (classifiedError.shouldReport) {
            yield* Effect.sync(() =>
              capturePostHogServerException(
                toError(error),
                {
                  request_id: requestContext.requestId,
                  http_method: requestContext.method,
                  url_path: requestContext.pathname,
                  operation: operationName,
                  transport_error_code: classifiedError.error._tag,
                  response_status_code: classifiedError.error.status,
                },
                correlation,
              ),
            );
          }

          return serverError(classifiedError.error);
        });
      }),
    ),
  );

  return await rootRuntime.runPromise(
    instrumentedProgram.pipe(Effect.provide(requestLayer)) as Effect.Effect<
      ServerResult<A>,
      never,
      never
    >,
  );
}
