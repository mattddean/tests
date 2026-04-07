import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

import { throwOnError } from "@/lib/server-result";
import { currentSessionEffect } from "@/server/runtime/request-context";
import { runServerResultEffect } from "@/server/runtime/run-server-result-effect";

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  return await runServerResultEffect(currentSessionEffect, {
    name: "auth.getSession",
  });
});

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: ["auth", "session"],
    queryFn: throwOnError(getSession),
  });
}
