import { Effect } from "effect";

import { logger } from "@/lib/observability/logger";
import { annotateCurrentEffectSpan, toError } from "@/lib/observability/tracing";
import { classifyServerError } from "@/lib/runtime/error-mapper";
import { serverError, serverOk, type ServerResult } from "@/lib/server-result";

import { CurrentRequest, RequestContext, makeRequestLayer } from "./layers/request";
import { runEffectBoundary } from "./run-effect-boundary";

export async function runServerResultEffect<A, E, R>(
  program: Effect.Effect<A, E, R>,
  options: {
    readonly name: string;
  },
): Promise<ServerResult<A>> {
  const operationName = options.name;
  const requestLayer = makeRequestLayer();
  return await runEffectBoundary(program, {
    name: operationName,
    requestLayer,
    onSuccess: (result) =>
      Effect.gen(function* () {
        yield* annotateCurrentEffectSpan({
          "app.operation": operationName,
        });

        return serverOk(result);
      }),
    onFailure: (error) => {
      const classifiedError = classifyServerError(error);

      return Effect.gen(function* () {
        const request = yield* CurrentRequest;
        const requestContext = yield* RequestContext;

        yield* annotateCurrentEffectSpan({
          "app.transport_error_code": classifiedError.error._tag,
          "http.response.status_code": classifiedError.error.status,
          "app.operation": operationName,
        });

        if (classifiedError.shouldReport) {
          yield* Effect.sync(() =>
            logger.error(
              toError(error),
              {
                request_id: requestContext.requestId,
                http_method: requestContext.method,
                url_path: requestContext.pathname,
                operation: operationName,
                transport_error_code: classifiedError.error._tag,
                response_status_code: classifiedError.error.status,
              },
              { request },
            ),
          );
        }

        return serverError(classifiedError.error);
      });
    },
  });
}
