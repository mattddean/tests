import { Context, Effect, Layer } from "effect";

import {
  captureException,
  emitPostHogServerLog,
  trackPostHogServerEvent,
  type LogMetadata,
  type ServerLogContext,
} from "@/server/observability/posthog-server";
import { toError } from "@/server/observability/tracing";

export type LoggerShape = {
  readonly debug: (
    message: string,
    metadata?: LogMetadata,
    serverLogContext?: ServerLogContext,
  ) => Effect.Effect<void>;
  readonly error: (
    error: unknown,
    metadata?: LogMetadata,
    serverLogContext?: ServerLogContext,
  ) => Effect.Effect<void>;
  readonly info: (
    message: string,
    metadata?: LogMetadata,
    serverLogContext?: ServerLogContext,
  ) => Effect.Effect<void>;
  readonly log: (
    message: string,
    metadata?: LogMetadata,
    serverLogContext?: ServerLogContext,
  ) => Effect.Effect<void>;
  readonly track: (
    event: string,
    metadata?: LogMetadata,
    serverLogContext?: ServerLogContext,
  ) => Effect.Effect<void>;
  readonly warn: (
    message: string,
    metadata?: LogMetadata,
    serverLogContext?: ServerLogContext,
  ) => Effect.Effect<void>;
};

export class AppLogger extends Context.Tag("AppLogger")<AppLogger, LoggerShape>() {}

function logToPostHog(
  level: "debug" | "info" | "log" | "warn",
  message: string,
  metadata?: LogMetadata,
  serverLogContext?: ServerLogContext,
) {
  return Effect.promise(() => emitPostHogServerLog(level, message, metadata, serverLogContext));
}

export const LoggerLive = Layer.succeed(AppLogger, {
  debug: (message, metadata, serverLogContext) =>
    Effect.zipRight(
      Effect.logDebug(message),
      logToPostHog("debug", message, metadata, serverLogContext),
    ),
  error: (error, metadata, serverLogContext) =>
    Effect.zipRight(
      Effect.logError(toError(error)),
      Effect.sync(() => {
        captureException(toError(error), metadata, serverLogContext);
      }),
    ),
  info: (message, metadata, serverLogContext) =>
    Effect.zipRight(
      Effect.logInfo(message),
      logToPostHog("info", message, metadata, serverLogContext),
    ),
  log: (message, metadata, serverLogContext) =>
    Effect.zipRight(Effect.log(message), logToPostHog("log", message, metadata, serverLogContext)),
  track: (event, metadata, serverLogContext) =>
    Effect.sync(() => {
      trackPostHogServerEvent(event, metadata ?? {}, serverLogContext ?? {});
    }),
  warn: (message, metadata, serverLogContext) =>
    Effect.zipRight(
      Effect.logWarning(message),
      logToPostHog("warn", message, metadata, serverLogContext),
    ),
});
