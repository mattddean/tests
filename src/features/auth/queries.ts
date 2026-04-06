import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

import { throwOnError } from "@/lib/server-result";
import { runServerResultEffect } from "@/server/runtime/run-server-result-effect";

import { getServerSessionEffect } from "./server";

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  return await runServerResultEffect(getServerSessionEffect, {
    name: "auth.getSession",
  });
});

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: ["auth", "session"],
    queryFn: throwOnError(getSession),
  });
}
