import { Effect } from "effect";

import { logger } from "@/lib/observability/logger";
import { annotateCurrentEffectSpan, toError } from "@/lib/observability/tracing";
import { POSTHOG_DISTINCT_ID_HEADER, POSTHOG_SESSION_ID_HEADER } from "@/lib/posthog";

import { RequestContext, makeRequestLayerFromRequest } from "./layers/request";
import { runEffectBoundary } from "./run-effect-boundary";

export async function runHttpEffect<A, E, R>(
  program: Effect.Effect<A, E, R>,
  options: {
    readonly name: string;
    readonly request: Request;
    readonly getStatus?: (value: A) => number | undefined;
  },
) {
  const requestLayer = makeRequestLayerFromRequest(options.request);
  return await runEffectBoundary(program, {
    name: options.name,
    requestLayer,
    onSuccess: (result) =>
      Effect.gen(function* () {
        const status = options.getStatus?.(result);

        yield* annotateCurrentEffectSpan({
          "posthog.distinct_id":
            options.request.headers.get(POSTHOG_DISTINCT_ID_HEADER) ?? undefined,
          "posthog.session_id": options.request.headers.get(POSTHOG_SESSION_ID_HEADER) ?? undefined,
          "http.response.status_code": status,
        });

        return result;
      }),
    onFailure: (error) =>
      Effect.gen(function* () {
        const requestContext = yield* RequestContext;

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
      }),
  });
}
