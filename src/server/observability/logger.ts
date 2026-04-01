import { Context, Effect, Layer } from "effect";

export type LoggerShape = {
  readonly info: (message: string, meta?: Record<string, unknown>) => Effect.Effect<void>;
  readonly error: (message: string, meta?: Record<string, unknown>) => Effect.Effect<void>;
};

export class AppLogger extends Context.Tag("AppLogger")<AppLogger, LoggerShape>() {}

export const LoggerLive = Layer.succeed(AppLogger, {
  info: (message, meta) =>
    Effect.sync(() => {
      console.info(message, meta ?? {});
    }),
  error: (message, meta) =>
    Effect.sync(() => {
      console.error(message, meta ?? {});
    }),
});
