import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "@/errors";

const loggerError = vi.fn();
const getRequest = vi.fn(
  () =>
    new Request("https://example.com/", {
      method: "GET",
    }),
);
const startedSpans: Array<{
  name: string;
  attributes: Map<string, unknown>;
}> = [];

vi.mock("@tanstack/react-start/server", () => ({
  getRequest,
}));

vi.mock("@/server/runtime/layers/root", async () => {
  const effectModule = await import("effect");
  const tracerModule = await import("effect/Tracer");
  const optionModule = await import("effect/Option");
  const exitModule = await import("effect/Exit");

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
        effectModule.Effect.runPromise(effect.pipe(effectModule.Effect.withTracer(tracer))),
      runPromiseExit: (effect: Parameters<typeof effectModule.Effect.runPromiseExit>[0]) =>
        effectModule.Effect.runPromiseExit(
          effect.pipe(effectModule.Effect.withTracer(tracer)),
        ).then((exit) => {
          if (exitModule.isSuccess(exit)) {
            return exit;
          }

          return exit;
        }),
    },
  };
});

vi.mock("@/server/runtime/layers/request", async () => {
  const effectModule = await import("effect");
  const request = getRequest();
  const CurrentRequest = effectModule.Context.Tag("CurrentRequest")<never, Request>();
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
    CurrentRequest,
    RequestContext,
    makeRequestLayer: () =>
      effectModule.Layer.mergeAll(
        effectModule.Layer.succeed(CurrentRequest, request),
        effectModule.Layer.succeed(RequestContext, {
          headers: request.headers,
          requestId: "request-1",
          method: "GET",
          pathname: "/",
        }),
      ),
  };
});

vi.mock("@/server/observability/logger", async () => {
  return {
    logger: {
      error: loggerError,
    },
  };
});

describe("runServerResultEffect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    startedSpans.length = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns successful results as ok values", async () => {
    const effectModule = await import("effect");
    const { runServerResultEffect } = await import("./run-server-result-effect");

    await expect(
      runServerResultEffect(effectModule.Effect.succeed("ok"), {
        name: "tests.getTests",
      }),
    ).resolves.toEqual({
      ok: true,
      value: "ok",
    });
  });

  it("returns reportable tagged failures without reporting them", async () => {
    const effectModule = await import("effect");
    const { runServerResultEffect } = await import("./run-server-result-effect");

    await expect(
      runServerResultEffect(
        effectModule.Effect.fail(
          new UnauthorizedError({
            message: "Unauthorized",
          }),
        ),
        {
          name: "auth.requireUser",
        },
      ),
    ).resolves.toEqual({
      ok: false,
      error: {
        _tag: "UnauthorizedError",
        message: "Unauthorized",
        status: 401,
      },
    });

    expect(loggerError).not.toHaveBeenCalled();
  });

  it("reports unexpected failures and returns a generic public error", async () => {
    const effectModule = await import("effect");
    const { runServerResultEffect } = await import("./run-server-result-effect");

    await expect(
      runServerResultEffect(effectModule.Effect.fail("Database connection failed"), {
        name: "tests.getTestEditor",
      }),
    ).resolves.toEqual({
      ok: false,
      error: {
        _tag: "UnexpectedServerError",
        message: "Internal Server Error",
        status: 500,
      },
    });

    expect(loggerError).toHaveBeenCalledTimes(1);
  });
});
