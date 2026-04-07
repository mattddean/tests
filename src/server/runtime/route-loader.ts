import type { Effect } from "effect";

import { redirect } from "@tanstack/react-router";

import { UnauthorizedError } from "@/domains/auth/errors";
import { toServerResultError } from "@/lib/server-result";

import { runServerResultEffect } from "./run-server-result-effect";

export async function runRouteLoaderEffect<A, E, R>(program: Effect.Effect<A, E, R>) {
  const result = await runServerResultEffect(program, {
    name: "route.loader",
  });

  if (result.ok) {
    return result.value;
  }

  if (result.error.status === 401 || result.error._tag === UnauthorizedError.name) {
    throw redirect({ to: "/auth" });
  }

  throw toServerResultError(result.error);
}
