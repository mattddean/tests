import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "@/domains/auth/errors";

const capturePostHogServerException = vi.fn();
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

vi.mock("@/server/runtime/root-runtime", async () => {
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

vi.mock("@/server/runtime/request-context", async () => {
  const effectModule = await import("effect");

  return {
    makeRequestLayer: () => effectModule.Layer.empty,
  };
});

vi.mock("@/server/observability/posthog-server", async () => {
  return {
    capturePostHogServerException,
    extractPostHogCorrelationFromHeaders: (headers: Headers) => ({
      distinctId: headers.get("X-PostHog-Distinct-Id") ?? undefined,
      sessionId: headers.get("X-PostHog-Session-Id") ?? undefined,
    }),
  };
});

describe("runServerEffect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    startedSpans.length = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a span with the provided operation name and annotates request metadata", async () => {
    const effectModule = await import("effect");
    const { runServerEffect } = await import("./run-server-effect");

    await expect(
      runServerEffect(effectModule.Effect.succeed("ok"), {
        name: "tests.getTests",
      }),
    ).resolves.toBe("ok");

    const span = startedSpans.find((candidate) => candidate.name === "tests.getTests");

    expect(span).toBeDefined();
    expect(span?.attributes.get("http.method")).toBe("GET");
    expect(span?.attributes.get("url.path")).toBe("/");
    expect(span?.attributes.get("app.operation")).toBe("tests.getTests");
  });

  it("maps failures to TransportError and records the exception", async () => {
    const effectModule = await import("effect");
    const { runServerEffect } = await import("./run-server-effect");

    await expect(
      runServerEffect(
        effectModule.Effect.fail(
          new UnauthorizedError({
            message: "Unauthorized",
          }),
        ),
        {
          name: "auth.requireUser",
        },
      ),
    ).rejects.toMatchObject({
      name: "TransportError",
      status: 401,
      code: "UnauthorizedError",
    });

    expect(capturePostHogServerException).toHaveBeenCalledTimes(1);
  });
});
