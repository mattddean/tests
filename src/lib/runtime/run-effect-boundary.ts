import { Cause, Effect, type Layer } from "effect";

import {
  annotateCurrentEffectSpan,
  getErrorType,
  markCurrentEffectSpanAsError,
  toError,
  withActiveSpanContext,
} from "@/lib/observability/tracing";

import { RequestContext, type CurrentRequest } from "./layers/request";
import { rootRuntime } from "./layers/root";

function unwrapEffectCause(error: unknown): unknown {
  if (!error || typeof error !== "object") {
    return error;
  }

  if ("cause" in error && error.cause) {
    return unwrapEffectCause(error.cause);
  }

  return error;
}

export async function runEffectBoundary<A, E, R, Success, Failure>(
  program: Effect.Effect<A, E, R>,
  options: {
    readonly name: string;
    readonly requestLayer: Layer.Layer<any, any, any>;
    readonly onSuccess: (value: A) => Effect.Effect<Success, any, RequestContext>;
    readonly onFailure: (
      error: unknown,
    ) => Effect.Effect<Failure, any, CurrentRequest | RequestContext>;
  },
): Promise<Success | Failure> {
  const instrumentedProgram = withActiveSpanContext(
    Effect.gen(function* () {
      const requestContext = yield* RequestContext;

      yield* annotateCurrentEffectSpan({
        "app.request_id": requestContext.requestId,
        "http.method": requestContext.method,
        "url.path": requestContext.pathname,
      });

      const result = yield* program;
      return yield* options.onSuccess(result);
    }).pipe(
      Effect.withSpan(options.name, {
        kind: "server",
      }),
      Effect.catchAllCause((cause) => {
        const error = unwrapEffectCause(Cause.squash(cause));

        return Effect.gen(function* () {
          yield* annotateCurrentEffectSpan({
            "error.type": getErrorType(error),
            "error.message": toError(error).message,
          });
          yield* markCurrentEffectSpanAsError(error);
          return yield* options.onFailure(error);
        });
      }),
    ),
  );

  return await rootRuntime.runPromise(
    instrumentedProgram.pipe(Effect.provide(options.requestLayer)) as Effect.Effect<
      Success | Failure,
      any,
      never
    >,
  );
}
