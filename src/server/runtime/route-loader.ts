import { redirect } from "@tanstack/react-router";
import type { Effect } from "effect";
import { UnauthorizedError } from "@/domains/auth/errors";
import { runServerEffect } from "./run-server-effect";

export async function runRouteLoaderEffect<A, E, R>(program: Effect.Effect<A, E, R>) {
  try {
    return await runServerEffect(program);
  } catch (error) {
    if (error instanceof UnauthorizedError || (error instanceof Error && error.name === "TransportError" && "status" in error && error.status === 401)) {
      throw redirect({ to: "/auth" });
    }

    throw error;
  }
}
