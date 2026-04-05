import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  capturePostHogServerException,
  ensurePostHogServerStarted,
  extractPostHogCorrelationFromHeaders,
  resetPostHogServerForTesting,
  setOtelSdkForTesting,
  setPostHogConfigForTesting,
  setPostHogFactoriesForTesting,
  setPostHogServerForTesting,
  shutdownPostHogServer,
  type PostHogNode,
} from "./posthog-server";

describe("posthog server helpers", () => {
  beforeEach(() => {
    resetPostHogServerForTesting();
  });

  afterEach(async () => {
    await shutdownPostHogServer();
    resetPostHogServerForTesting();
    vi.restoreAllMocks();
  });

  it("initializes the shared client and sdk once", async () => {
    const createClient = vi.fn(
      () =>
        ({
          shutdown: vi.fn(() => Promise.resolve()),
        }) as unknown as PostHogNode,
    );
    const createSdk = vi.fn(() => ({
      shutdown: vi.fn(() => Promise.resolve()),
    }));

    setPostHogConfigForTesting({
      host: "https://app.posthog.com",
      projectToken: "phc_test",
      tracesUrl: "https://app.posthog.com/i/v1/traces",
    });
    setPostHogFactoriesForTesting({
      createClient,
      createSdk,
      getTracerProvider: () => ({}) as never,
    });

    await ensurePostHogServerStarted();
    await ensurePostHogServerStarted();

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createSdk).toHaveBeenCalledTimes(1);
  });

  it("shuts down shared resources idempotently", async () => {
    const clientShutdown = vi.fn(() => Promise.resolve());
    const sdkShutdown = vi.fn(() => Promise.resolve());

    setPostHogServerForTesting({
      shutdown: clientShutdown,
    } as unknown as PostHogNode);
    setOtelSdkForTesting(
      {
        shutdown: sdkShutdown,
      },
      null,
    );

    await shutdownPostHogServer();
    await shutdownPostHogServer();

    expect(clientShutdown).toHaveBeenCalledTimes(1);
    expect(sdkShutdown).toHaveBeenCalledTimes(1);
  });

  it("derives distinct and session ids from request headers", () => {
    const headers = new Headers({
      "X-PostHog-Distinct-Id": "distinct-123",
      "X-PostHog-Session-Id": "session-123",
    });

    expect(extractPostHogCorrelationFromHeaders(headers)).toEqual({
      distinctId: "distinct-123",
      sessionId: "session-123",
    });
  });

  it("captures exceptions with derived metadata", () => {
    const captureException = vi.fn();

    setPostHogServerForTesting({
      captureException,
      shutdown: vi.fn(() => Promise.resolve()),
    } as unknown as PostHogNode);

    capturePostHogServerException(
      new Error("boom"),
      { route: "/tests" },
      {
        distinctId: "distinct-123",
        sessionId: "session-123",
      },
    );

    expect(captureException).toHaveBeenCalledWith(
      expect.any(Error),
      "distinct-123",
      expect.objectContaining({
        route: "/tests",
        $session_id: "session-123",
      }),
    );
  });
});
