import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

import { currentSessionEffect } from "@/lib/runtime/layers/request";
import { runServerResultEffect } from "@/lib/runtime/run-server-result-effect";
import { throwOnError } from "@/lib/server-result";

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
