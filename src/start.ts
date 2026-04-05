import { SpanKind, trace } from "@opentelemetry/api";
import { createMiddleware, createStart } from "@tanstack/react-start";

import { getPostHogHeaders } from "@/lib/posthog";
import {
  OBSERVABILITY_SERVICE_NAME,
  getRequestTraceDetails,
  markSpanAsError,
  setSpanAttributes,
  toError,
} from "@/server/observability/tracing";

const tracer = trace.getTracer(OBSERVABILITY_SERVICE_NAME);

export const postHogRequestMiddleware = createMiddleware().server(
  async ({ next, pathname, request }) => {
    const {
      capturePostHogServerException,
      ensurePostHogServerStarted,
      extractPostHogCorrelationFromRequest,
    } = await import("@/server/observability/posthog-server");

    await ensurePostHogServerStarted();

    const requestDetails = getRequestTraceDetails(request);
    const correlation = extractPostHogCorrelationFromRequest(request);

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
          capturePostHogServerException(
            toError(error),
            {
              request_id: requestDetails.requestId,
              http_method: requestDetails.method,
              url_path: pathname,
            },
            correlation,
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
