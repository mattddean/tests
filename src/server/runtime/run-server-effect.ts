import { Effect } from "effect";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { mapToTransportError } from "@/server/errors/error-mapper";
import { makeRequestLayer } from "./request-context";
import { rootRuntime } from "./root-runtime";

function unwrapEffectCause(error: unknown): unknown {
  if (!error || typeof error !== "object") {
    return error;
  }

  if ("cause" in error && error.cause) {
    return unwrapEffectCause(error.cause);
  }

  return error;
}

export function tryServerPromise<A>(message: string, try_: () => Promise<A>) {
  return Effect.tryPromise({
    try: try_,
    catch: (cause) => (cause instanceof Error ? cause : new Error(message)),
  });
}

export async function runServerEffect<A, E, R>(
  program: Effect.Effect<A, E, R>,
  options?: {
    readonly headers?: Headers;
  },
) {
  const headers = options?.headers ?? getRequestHeaders();
  const requestLayer = makeRequestLayer(headers);

  try {
    return await rootRuntime.runPromise(
      program.pipe(Effect.provide(requestLayer)) as Effect.Effect<A, E, never>,
    );
  } catch (error) {
    throw mapToTransportError(unwrapEffectCause(error));
  }
}
