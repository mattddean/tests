import { Cause, Effect } from "effect";

import { POSTHOG_DISTINCT_ID_HEADER, POSTHOG_SESSION_ID_HEADER } from "@/lib/posthog";
import { logger } from "@/server/observability/logger";
import {
  annotateCurrentEffectSpan,
  getErrorType,
  markCurrentEffectSpanAsError,
  toError,
  withActiveSpanContext,
} from "@/server/observability/tracing";

import { RequestContext, makeRequestLayerFromRequest } from "./request-context";
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

export async function runHttpEffect<A, E, R>(
  program: Effect.Effect<A, E, R>,
  options: {
    readonly name: string;
    readonly request: Request;
    readonly getStatus?: (value: A) => number | undefined;
  },
) {
  const requestLayer = makeRequestLayerFromRequest(options.request);

  const instrumentedProgram = withActiveSpanContext(
    Effect.gen(function* () {
      const requestContext = yield* RequestContext;

      yield* annotateCurrentEffectSpan({
        "app.request_id": requestContext.requestId,
        "http.method": requestContext.method,
        "url.path": requestContext.pathname,
        "posthog.distinct_id": options.request.headers.get(POSTHOG_DISTINCT_ID_HEADER) ?? undefined,
        "posthog.session_id": options.request.headers.get(POSTHOG_SESSION_ID_HEADER) ?? undefined,
      });

      const result = yield* program;
      const status = options.getStatus?.(result);

      if (status !== undefined) {
        yield* annotateCurrentEffectSpan({
          "http.response.status_code": status,
        });
      }

      return result;
    }).pipe(
      Effect.withSpan(options.name, {
        kind: "server",
      }),
      Effect.catchAllCause((cause) => {
        const error = unwrapEffectCause(Cause.squash(cause));

        return Effect.gen(function* () {
          const requestContext = yield* RequestContext;

          yield* annotateCurrentEffectSpan({
            "error.type": getErrorType(error),
            "error.message": toError(error).message,
          });
          yield* markCurrentEffectSpanAsError(error);
          yield* Effect.sync(() =>
            logger.error(
              toError(error),
              {
                request_id: requestContext.requestId,
                http_method: requestContext.method,
                url_path: requestContext.pathname,
              },
              { request: options.request },
            ),
          );

          return yield* Effect.fail(error as E);
        });
      }),
    ),
  );

  return await rootRuntime.runPromise(
    instrumentedProgram.pipe(Effect.provide(requestLayer)) as Effect.Effect<A, E, never>,
  );
}
