import { Effect, ManagedRuntime } from "effect";
import { DbLive } from "@/db/effect";
import { UnexpectedServerError } from "./errors";

const runtime = ManagedRuntime.make(DbLive);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function formatUnknownError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (isRecord(error)) {
    const message = typeof error.message === "string" ? error.message : null;
    const code = typeof error.code === "string" ? error.code : null;
    const detail = typeof error.detail === "string" ? error.detail : null;
    const hint = typeof error.hint === "string" ? error.hint : null;

    return [message, code ? `code: ${code}` : null, detail, hint].filter(Boolean).join("\n");
  }

  return "Unexpected server error";
}

function unwrapEffectCause(error: unknown): unknown {
  if (!isRecord(error)) {
    return error;
  }

  if (error._tag === "EffectDrizzleQueryError" && "cause" in error) {
    return error.cause;
  }

  if (error._tag === "SqlError" && "cause" in error && error.cause) {
    return error.cause;
  }

  return error;
}

export function tryServerPromise<A>(message: string, try_: () => Promise<A>) {
  return Effect.tryPromise({
    try: try_,
    catch: (cause) =>
      cause instanceof Error
        ? cause
        : new UnexpectedServerError({
            message,
            cause,
          }),
  });
}

export function unexpectedError(message: string, cause?: unknown) {
  return new UnexpectedServerError({
    message,
    cause,
  });
}

export async function runServerEffect<A, E, R>(program: Effect.Effect<A, E, R>) {
  try {
    return await runtime.runPromise(program as Effect.Effect<A, E, never>);
  } catch (error) {
    const unwrapped = unwrapEffectCause(error);
    throw new Error(formatUnknownError(unwrapped));
  }
}
