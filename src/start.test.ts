import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const runHttpEffect = vi.fn((effect, _options) =>
  import("effect").then(({ Cause, Effect, Exit }) =>
    Effect.runPromiseExit(effect).then((exit) => {
      if (Exit.isSuccess(exit)) {
        return exit.value;
      }

      throw Cause.squash(exit.cause);
    }),
  ),
);

vi.mock("@/lib/runtime/run-http-effect", () => ({
  runHttpEffect,
}));

describe("start middleware", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalWindow === undefined) {
      Reflect.deleteProperty(globalThis, "window");
    } else {
      globalThis.window = originalWindow;
    }
    vi.restoreAllMocks();
  });

  it("injects PostHog headers into client-originating server function requests", async () => {
    globalThis.window = {
      posthog: {
        get_distinct_id: () => "distinct-123",
        get_session_id: () => "session-123",
      },
    } as never;

    const { postHogFunctionMiddleware } = await import("./start");

    const result = await postHogFunctionMiddleware.options.client?.({
      next: async (payload: {
        context?: unknown;
        fetch?: unknown;
        headers?: HeadersInit;
        sendContext?: unknown;
      }) => ({
        context: payload?.context,
        fetch: payload?.fetch,
        headers: payload?.headers ?? {},
        sendContext: payload?.sendContext,
      }),
    } as never);

    expect(result?.headers).toEqual({
      "X-PostHog-Distinct-Id": "distinct-123",
      "X-PostHog-Session-Id": "session-123",
    });
  });

  it("wraps request handling and preserves thrown errors", async () => {
    const { postHogRequestMiddleware } = await import("./start");
    const request = new Request("https://example.com/tests");
    const error = new Error("request failed");

    await expect(
      postHogRequestMiddleware.options.server?.({
        context: {},
        next: async () => {
          throw error;
        },
        pathname: "/tests",
        request,
      } as never),
    ).rejects.toBe(error);

    expect(runHttpEffect).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        name: "HTTP GET /tests",
        request,
        getStatus: expect.any(Function),
      }),
    );
  });

  it("delegates successful requests to the Effect HTTP boundary", async () => {
    const { postHogRequestMiddleware } = await import("./start");
    const request = new Request("https://example.com/tests");
    const response = new Response(null, { status: 204 });

    await expect(
      postHogRequestMiddleware.options.server?.({
        context: {},
        next: async () => response,
        pathname: "/tests",
        request,
      } as never),
    ).resolves.toBe(response);

    expect(runHttpEffect).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        name: "HTTP GET /tests",
        request,
        getStatus: expect.any(Function),
      }),
    );
  });
});
