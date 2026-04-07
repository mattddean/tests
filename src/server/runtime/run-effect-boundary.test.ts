import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const annotateCurrentEffectSpan = vi.fn((_attributes: Record<string, unknown>) => Effect.void);
const markCurrentEffectSpanAsError = vi.fn((_error: unknown) => Effect.void);
const startedSpans: Array<{
  name: string;
  attributes: Map<string, unknown>;
  ended: boolean;
  status?: unknown;
  recordedExceptions: unknown[];
}> = [];

vi.mock("@/server/observability/tracing", async () => {
  return {
    getErrorType: (error: unknown) => (error instanceof Error ? error.name : "UnknownError"),
    annotateCurrentEffectSpan,
    markCurrentEffectSpanAsError,
    toError: (error: unknown) => (error instanceof Error ? error : new Error(String(error))),
    withActiveSpanContext: (effect: unknown) => effect,
  };
});

vi.mock("@/server/runtime/layers/request", async () => {
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
  };
});

vi.mock("@/server/runtime/layers/root", async () => {
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
        ended: false,
        recordedExceptions: [] as unknown[],
        setStatus(status: unknown) {
          (span as { status: unknown }).status = status;
        },
        recordException(error: unknown) {
          span.recordedExceptions.push(error);
        },
        end() {
          span.ended = true;
        },
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

describe("runEffectBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    startedSpans.length = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds base request metadata and uses the shared runtime on success", async () => {
    const effectModule = await import("effect");
    const { runEffectBoundary } = await import("./run-effect-boundary");
    const { RequestContext } = await import("./layers/request");

    const requestLayer = effectModule.Layer.succeed(RequestContext, {
      headers: new Headers(),
      requestId: "request-1",
      method: "GET",
      pathname: "/tests",
    });

    await expect(
      runEffectBoundary(effectModule.Effect.succeed("ok"), {
        name: "tests.sharedBoundary",
        requestLayer,
        onSuccess: (value) => effectModule.Effect.succeed(value),
        onFailure: () => effectModule.Effect.succeed("failed"),
      }),
    ).resolves.toBe("ok");

    const span = startedSpans.find((candidate) => candidate.name === "tests.sharedBoundary");

    expect(span).toBeDefined();
    expect(annotateCurrentEffectSpan).toHaveBeenCalledWith({
      "app.request_id": "request-1",
      "http.method": "GET",
      "url.path": "/tests",
    });
  });

  it("squashes nested causes, annotates error details, and routes to onFailure", async () => {
    const effectModule = await import("effect");
    const { runEffectBoundary } = await import("./run-effect-boundary");
    const { RequestContext } = await import("./layers/request");

    const requestLayer = effectModule.Layer.succeed(RequestContext, {
      headers: new Headers(),
      requestId: "request-1",
      method: "GET",
      pathname: "/tests",
    });
    const innerError = new Error("inner failure");

    const result = await runEffectBoundary(
      effectModule.Effect.fail(new Error("outer failure", { cause: innerError }) as Error),
      {
        name: "tests.sharedBoundary.failure",
        requestLayer,
        onSuccess: (value) => effectModule.Effect.succeed(value),
        onFailure: (error) =>
          effectModule.Effect.succeed({
            message: error instanceof Error ? error.message : String(error),
          }),
      },
    );

    expect(result).toEqual({
      message: "inner failure",
    });

    expect(annotateCurrentEffectSpan).toHaveBeenCalledWith({
      "error.type": "Error",
      "error.message": "inner failure",
    });
    expect(markCurrentEffectSpanAsError).toHaveBeenCalledWith(innerError);
  });
});
