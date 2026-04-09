import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loggerError = vi.fn();
const startedSpans: Array<{
  name: string;
  attributes: Map<string, unknown>;
}> = [];

vi.mock("@/lib/observability/logger", () => ({
  logger: {
    error: loggerError,
  },
}));

vi.mock("@/lib/runtime/layers/request", async () => {
  const effectModule = await import("effect");
  const RequestContext = effectModule.Context.Tag("RequestContext")<
    never,
    {
      readonly headers: Headers;
      readonly requestId: string;
      readonly method: string;
      readonly pathname: string;
    }
  >();

  return {
    RequestContext,
    makeRequestLayerFromRequest: (request: Request) =>
      effectModule.Layer.succeed(RequestContext, {
        headers: request.headers,
        requestId: "request-1",
        method: request.method.toUpperCase(),
        pathname: new URL(request.url).pathname,
      }),
  };
});

vi.mock("@/lib/runtime/layers/root", async () => {
  const effectModule = await import("effect");
  const tracerModule = await import("effect/Tracer");
  const optionModule = await import("effect/Option");
  const exitModule = await import("effect/Exit");
  const causeModule = await import("effect/Cause");

  const tracer = tracerModule.make({
    span(name, _parent, context, links, startTime, kind, options) {
      const span = {
        _tag: "Span" as const,
        name,
        spanId: `span-${startedSpans.length + 1}`,
        traceId: "trace-1",
        parent: optionModule.none(),
        context,
        status: {
          _tag: "Started" as const,
          startTime,
        },
        attributes: new Map<string, unknown>(Object.entries(options?.attributes ?? {})),
        links,
        sampled: true,
        kind,
        end() {},
        attribute(key: string, value: unknown) {
          span.attributes.set(key, value);
        },
        event() {},
        addLinks() {},
      };

      startedSpans.push(span);
      return span;
    },
    context: (fn) => fn(),
  });

  return {
    rootRuntime: {
      runPromise: (effect: Parameters<typeof effectModule.Effect.runPromise>[0]) =>
        effectModule.Effect.runPromiseExit(
          effect.pipe(effectModule.Effect.withTracer(tracer)),
        ).then((exit) => {
          if (exitModule.isSuccess(exit)) {
            return exit.value;
          }

          throw causeModule.squash(exit.cause);
        }),
    },
  };
});

describe("runHttpEffect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    startedSpans.length = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a top-level request span and annotates response status", async () => {
    const effectModule = await import("effect");
    const { runHttpEffect } = await import("./run-http-effect");
    const request = new Request("https://example.com/tests", {
      headers: new Headers({
        "X-PostHog-Distinct-Id": "distinct-123",
        "X-PostHog-Session-Id": "session-123",
      }),
      method: "GET",
    });
    const response = new Response(null, { status: 204 });

    await expect(
      runHttpEffect(effectModule.Effect.succeed(response), {
        name: "HTTP GET /tests",
        request,
        getStatus: (value) => value.status,
      }),
    ).resolves.toBe(response);

    const span = startedSpans.find((candidate) => candidate.name === "HTTP GET /tests");

    expect(span).toBeDefined();
    expect(span?.attributes.get("http.method")).toBe("GET");
    expect(span?.attributes.get("url.path")).toBe("/tests");
    expect(span?.attributes.get("http.response.status_code")).toBe(204);
    expect(span?.attributes.get("posthog.distinct_id")).toBe("distinct-123");
    expect(span?.attributes.get("posthog.session_id")).toBe("session-123");
  });

  it("logs and rethrows request failures through the logger abstraction", async () => {
    const effectModule = await import("effect");
    const { runHttpEffect } = await import("./run-http-effect");
    const request = new Request("https://example.com/tests", {
      method: "GET",
    });
    const error = new Error("request failed");

    await expect(
      runHttpEffect(effectModule.Effect.fail(error), {
        name: "HTTP GET /tests",
        request,
      }),
    ).rejects.toMatchObject({
      message: "request failed",
    });

    expect(loggerError).toHaveBeenCalledTimes(1);
    expect(loggerError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        http_method: "GET",
        request_id: "request-1",
        url_path: "/tests",
      }),
      { request },
    );
  });
});
