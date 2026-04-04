import { Effect } from "effect";
import { rootRuntime } from "@/server/runtime/root-runtime";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { mapToTransportError } from "@/server/errors/error-mapper";
import { makeRequestLayer } from "@/server/runtime/request-context";

function unwrapEffectCause(error: unknown): unknown {
  if (!error || typeof error !== "object") {
    return error;
  }

  if ("cause" in error && error.cause) {
    return unwrapEffectCause(error.cause);
  }

  return error;
}

export async function runServerEffect<A, E, R>(
  program: Effect.Effect<A, E, R>,
  options?: {
    readonly headers?: Headers;
  },
) {
  const headers = options?.headers ?? getRequestHeaders();
  // Request-scoped values are created fresh on each call and provided on top of
  // the shared rootRuntime. That keeps headers/session/user isolated per request
  // while still reusing long-lived services from RootLayer.
  const requestLayer = makeRequestLayer(headers);

  try {
    return await rootRuntime.runPromise(
      program.pipe(Effect.provide(requestLayer)) as Effect.Effect<A, E, never>,
    );
  } catch (error) {
    throw mapToTransportError(unwrapEffectCause(error));
  }
}
