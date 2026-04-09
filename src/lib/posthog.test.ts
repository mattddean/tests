import { afterEach, describe, expect, it } from "vitest";

import {
  getPostHogHeaders,
  POSTHOG_DISTINCT_ID_HEADER,
  POSTHOG_SESSION_ID_HEADER,
} from "./posthog";

const originalWindow = globalThis.window;

afterEach(() => {
  if (originalWindow === undefined) {
    Reflect.deleteProperty(globalThis, "window");
  } else {
    globalThis.window = originalWindow;
  }
});

describe("getPostHogHeaders", () => {
  it("returns an empty object on the server", () => {
    Reflect.deleteProperty(globalThis, "window");

    expect(getPostHogHeaders()).toEqual({});
  });

  it("returns distinct and session headers in the browser", () => {
    globalThis.window = {
      posthog: {
        get_distinct_id: () => "distinct-123",
        get_session_id: () => "session-123",
      },
    } as never;

    expect(getPostHogHeaders()).toEqual({
      [POSTHOG_DISTINCT_ID_HEADER]: "distinct-123",
      [POSTHOG_SESSION_ID_HEADER]: "session-123",
    });
  });
});
