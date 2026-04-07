import { createMiddleware, createStart } from "@tanstack/react-start";
import { Effect } from "effect";

import { getPostHogHeaders } from "@/lib/posthog";
import { runHttpEffect } from "@/server/runtime/run-http-effect";

export const postHogRequestMiddleware = createMiddleware().server(
  async ({ next, pathname, request }) => {
    return await runHttpEffect(
      Effect.tryPromise<Awaited<ReturnType<typeof next>>, Error>({
        try: async () => await next(),
        catch: (error: unknown) =>
          error instanceof Error ? error : new Error("Request failed", { cause: error }),
      }),
      {
        name: `HTTP ${request.method.toUpperCase()} ${pathname}`,
        request,
        getStatus: (result) => {
          const response = result instanceof Response ? result : result.response;
          return response.status;
        },
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
