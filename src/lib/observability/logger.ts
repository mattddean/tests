import { isServer } from "@/lib/is-server";

import type { PostHogServer, ServerLogContext, LogMetadata } from "./posthog-server";

type ErrorInput<T> = unknown extends T ? T : T extends Error ? T : never;

export type { ServerLogContext, LogMetadata } from "./posthog-server";
export interface Logger {
  debug: (message: string, metadata?: LogMetadata, serverLogContext?: ServerLogContext) => void;
  error: <T>(
    error: ErrorInput<T>,
    metadata?: LogMetadata,
    serverLogContext?: ServerLogContext,
  ) => void;
  info: (message: string, metadata?: LogMetadata, serverLogContext?: ServerLogContext) => void;
  log: (message: string, metadata?: LogMetadata, serverLogContext?: ServerLogContext) => void;
  track: (event: string, metadata?: LogMetadata, serverLogContext?: ServerLogContext) => void;
  warn: (message: string, metadata?: LogMetadata, serverLogContext?: ServerLogContext) => void;
}

export const logger = createLogger();

type ServerTransport = { postHogServer: PostHogServer };
let serverTransportPromise: Promise<ServerTransport | undefined> | undefined = undefined;

function loadServerTransport(): Promise<PostHogServer | undefined> {
  if (!isServer) {
    return Promise.resolve(undefined);
  }

  serverTransportPromise ??= import("./posthog-server") as Promise<ServerTransport>;
  return serverTransportPromise.then((promise) => promise?.postHogServer);
}

function serializeLogMessage(value: unknown): string {
  if (value instanceof Error) {
    return value.stack || `${value.name}: ${value.message}`;
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

type LogMethodName = "debug" | "info" | "log" | "warn";
function forwardServerLog(
  level: LogMethodName,
  msg: string | Error,
  metadata: LogMetadata | undefined,
  serverLogContext: ServerLogContext | undefined,
): void {
  const message = serializeLogMessage(msg);
  void loadServerTransport().then((serverTransport) => {
    void serverTransport?.emitLog(level, message, metadata, serverLogContext);
  });
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  // We'll try our best with TypeScript to not have primitives passed to logger.error,
  // but if one slips through, we'll convert it to an error.
  if (
    typeof error === "string" ||
    typeof error === "number" ||
    typeof error === "bigint" ||
    typeof error === "symbol" ||
    typeof error === "boolean"
  ) {
    return new Error(String(error));
  }

  return new Error("Non-Error value passed to logger.error", { cause: error });
}

function createLogger(): Logger {
  return {
    debug: (...args) => {
      console.debug(...args);
      if (isServer) {
        forwardServerLog("debug", ...args);
      }
    },
    error: (...args) => {
      const [error, metadata, context] = args;
      const normalizedError = normalizeError(error);
      console.error(normalizedError);
      if (isServer) {
        forwardServerLog("debug", normalizedError, metadata, context);
        void loadServerTransport().then((serverTransport) => {
          serverTransport?.captureException(normalizedError, metadata, context);
        });
        return;
      }
      window.posthog?.captureException(error, metadata);
    },
    info: (...args) => {
      console.info(...args);
      if (isServer) {
        forwardServerLog("info", ...args);
      }
    },
    log: (...args) => {
      console.log(...args);
      if (isServer) {
        forwardServerLog("log", ...args);
      }
    },
    warn: (...args) => {
      console.warn(...args);
      if (isServer) {
        forwardServerLog("warn", ...args);
      }
    },
    track: (event, metadata, serverLogContext) => {
      if (!isServer) {
        window.posthog?.capture(event, metadata);
        return;
      }
      void loadServerTransport().then((serverTransport) => {
        serverTransport?.trackEvent(event, metadata ?? {}, serverLogContext ?? {});
      });
    },
  };
}
