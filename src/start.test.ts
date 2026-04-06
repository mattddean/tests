import { trace } from "@opentelemetry/api";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loggerError = vi.fn();

const startActiveSpan = vi.fn(
  async (
    _name: string,
    _options: unknown,
    callback: (span: {
      end: ReturnType<typeof vi.fn>;
      recordException: ReturnType<typeof vi.fn>;
      setAttribute: ReturnType<typeof vi.fn>;
      setStatus: ReturnType<typeof vi.fn>;
    }) => unknown,
  ) =>
    callback({
      end: vi.fn(),
      recordException: vi.fn(),
      setAttribute: vi.fn(),
      setStatus: vi.fn(),
    }),
);

vi.mock("@/server/observability/logger", () => ({
  logger: {
    error: loggerError,
  },
}));

describe("start middleware", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.clearAllMocks();
    trace.setGlobalTracerProvider({
      getTracer: () =>
        ({
          startActiveSpan,
        }) as never,
    } as never);
  });

  afterEach(() => {
    trace.disable();
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

    expect(startActiveSpan).toHaveBeenCalledWith(
      "HTTP GET /tests",
      expect.objectContaining({
        kind: 1,
      }),
      expect.any(Function),
    );
    expect(loggerError).toHaveBeenCalledTimes(1);
  });
});
