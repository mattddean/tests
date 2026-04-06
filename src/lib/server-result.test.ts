import { describe, expect, it } from "vitest";

import { serverError, serverOk, throwOnError, unwrapServerResult } from "./server-result";

describe("server-result helpers", () => {
  it("unwraps successful results", () => {
    expect(unwrapServerResult(serverOk("ok"))).toBe("ok");
  });

  it("throws a tagged client-side error for failed results", () => {
    expect(() =>
      unwrapServerResult(
        serverError({
          _tag: "ForbiddenTestAccess",
          message: "Forbidden",
          status: 403,
        }),
      ),
    ).toThrowError(
      expect.objectContaining({
        name: "ForbiddenTestAccess",
        message: "Forbidden",
        _tag: "ForbiddenTestAccess",
        status: 403,
      }),
    );
  });

  it("adapts result-returning functions into throwing functions", async () => {
    const loadValue = throwOnError(async (input: string) => {
      return input === "ok"
        ? serverOk("value")
        : serverError({
            _tag: "UnexpectedServerError",
            message: "Unexpected server error",
            status: 500,
          });
    });

    await expect(loadValue("ok")).resolves.toBe("value");
    await expect(loadValue("fail")).rejects.toMatchObject({
      name: "UnexpectedServerError",
      message: "Unexpected server error",
      _tag: "UnexpectedServerError",
      status: 500,
    });
  });
});
