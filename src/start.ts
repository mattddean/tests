import { SpanKind, trace } from "@opentelemetry/api";
import { createMiddleware, createStart } from "@tanstack/react-start";

import {
  getPostHogHeaders,
  POSTHOG_DISTINCT_ID_HEADER,
  POSTHOG_SESSION_ID_HEADER,
} from "@/lib/posthog";
import { logger } from "@/server/observability/logger";
import {
  OBSERVABILITY_SERVICE_NAME,
  getRequestTraceDetails,
  markSpanAsError,
  setSpanAttributes,
  toError,
} from "@/server/observability/tracing";

const tracer = trace.getTracer(OBSERVABILITY_SERVICE_NAME);

function getPostHogCorrelationFromRequest(request: Request) {
  return {
    distinctId: request.headers.get(POSTHOG_DISTINCT_ID_HEADER) ?? undefined,
    sessionId: request.headers.get(POSTHOG_SESSION_ID_HEADER) ?? undefined,
  };
}

export const postHogRequestMiddleware = createMiddleware().server(
  async ({ next, pathname, request }) => {
    const requestDetails = getRequestTraceDetails(request);
    const correlation = getPostHogCorrelationFromRequest(request);

    return await tracer.startActiveSpan(
      `HTTP ${requestDetails.method} ${pathname}`,
      {
        kind: SpanKind.SERVER,
      },
      async (span) => {
        setSpanAttributes(span, {
          "http.method": requestDetails.method,
          "url.path": pathname,
          "app.request_id": requestDetails.requestId,
          "posthog.distinct_id": correlation.distinctId,
          "posthog.session_id": correlation.sessionId,
        });

        try {
          const result = await next();
          const response = result instanceof Response ? result : result.response;

          setSpanAttributes(span, {
            "http.response.status_code": response.status,
          });

          return result;
        } catch (error) {
          markSpanAsError(span, error);
          logger.error(
            toError(error),
            {
              request_id: requestDetails.requestId,
              http_method: requestDetails.method,
              url_path: pathname,
            },
            { request },
          );
          throw error;
        } finally {
          span.end();
        }
      },
    );
  },
);

export const postHogFunctionMiddleware = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    return await next({
      headers: getPostHogHeaders(),
    });
  },
);

export const startInstance = createStart(() => ({
  requestMiddleware: [postHogRequestMiddleware],
  functionMiddleware: [postHogFunctionMiddleware],
}));
