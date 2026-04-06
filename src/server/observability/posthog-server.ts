import { SeverityNumber, logs } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { PostHog } from "posthog-node";

import { getAnalyticsConfig } from "./analytics";
import { env } from "./env";
import {
  POSTHOG_ANONYMOUS_ID,
  POSTHOG_DISTINCT_ID_HEADER,
  POSTHOG_SESSION_ID_HEADER,
} from "./posthog";

const LOG_NAMESPACE = "tz.mtdn.dev";

type AnalyticsConfig = NonNullable<ReturnType<typeof getAnalyticsConfig>>;
type LogLevel = "debug" | "info" | "log" | "warn" | "error";
export type PostHogNode = InstanceType<typeof PostHog>;
type ServerCorrelation = {
  readonly distinctId?: string;
  readonly sessionId?: string;
};
type PostHogConfigOverride = {
  readonly PUBLIC_POSTHOG_HOST?: string;
  readonly PUBLIC_POSTHOG_PROJECT_TOKEN?: string;
  readonly host?: string;
  readonly projectToken?: string;
  readonly tracesUrl?: string;
} | null;
type PostHogFactories = {
  readonly createClient?: (config: AnalyticsConfig) => PostHogNode;
  readonly createSdk?: (config: AnalyticsConfig) => OtelState["sdk"];
  readonly getTracerProvider?: () => unknown;
};

interface OtelState {
  SeverityNumber: typeof SeverityNumber;
  logger: ReturnType<typeof logs.getLogger>;
  sdk: {
    shutdown: () => Promise<void>;
    start?: () => void;
  };
}

let posthogClient: PostHogNode | null = null;
let otelState: OtelState | null = null;
let posthogShutdownPromise: Promise<void> | null = null;
let shutdownHandlersRegistered = false;
let analyticsConfigOverride: PostHogConfigOverride = null;
let posthogFactories: PostHogFactories = {};

function getResolvedAnalyticsConfig(): AnalyticsConfig | undefined {
  if (analyticsConfigOverride) {
    const host =
      analyticsConfigOverride.PUBLIC_POSTHOG_HOST ?? analyticsConfigOverride.host ?? undefined;
    const projectToken =
      analyticsConfigOverride.PUBLIC_POSTHOG_PROJECT_TOKEN ??
      analyticsConfigOverride.projectToken ??
      undefined;

    if (!host || !projectToken) {
      return undefined;
    }

    return {
      PUBLIC_POSTHOG_HOST: host,
      PUBLIC_POSTHOG_PROJECT_TOKEN: projectToken,
    };
  }

  return getAnalyticsConfig();
}

/** Get the PostHog server-side client. Uses a singleton pattern to avoid creating multiple clients. */
export function getPostHogServer(): PostHogNode | undefined {
  if (posthogClient) {
    return posthogClient;
  }

  const analyticsConfig = getResolvedAnalyticsConfig();
  if (!analyticsConfig) return;

  registerShutdownHandlers();

  posthogClient =
    posthogFactories.createClient?.(analyticsConfig) ??
    new PostHog(analyticsConfig.PUBLIC_POSTHOG_PROJECT_TOKEN, {
      host: analyticsConfig.PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
      enableExceptionAutocapture: true,
    });

  return posthogClient;
}

export function setPostHogServerForTesting(client: PostHogNode | null): void {
  posthogClient = client;
  posthogShutdownPromise = null;
}

function trackEvent(
  event: string,
  metadata: LogMetadata,
  serverLogContext: ServerLogContext,
): void {
  const distinctId = getDistinctId(serverLogContext);
  const sessionId = getSessionId(serverLogContext);
  const eventProperties = {
    ...metadata,
    ...(sessionId ? { $session_id: sessionId } : {}),
  };

  try {
    getPostHogServer()?.capture({
      distinctId,
      event,
      properties: eventProperties,
    });
  } catch (posthogError) {
    console.error("Failed to track event in PostHog:", posthogError);
  }
}

export function captureException(
  error: Error,
  metadata?: LogMetadata,
  serverLogContext?: ServerLogContext,
): void {
  const distinctId = getDistinctId(serverLogContext);
  const sessionId = getSessionId(serverLogContext);
  try {
    getPostHogServer()?.captureException(error, distinctId, {
      ...metadata,
      ...(sessionId ? { $session_id: sessionId } : {}),
    });
  } catch (posthogError) {
    console.error("Failed to capture exception in PostHog:", posthogError);
  }
}

/** Shutdown the PostHog client gracefully. Call this when your server is shutting down. */
export async function shutdownPostHog(): Promise<void> {
  if (!posthogClient && !otelState) {
    return;
  }

  if (posthogShutdownPromise) {
    await posthogShutdownPromise;
    return;
  }

  const client = posthogClient;
  const currentOtelState = otelState;

  posthogShutdownPromise = Promise.all([
    client ? Promise.resolve(client.shutdown()) : Promise.resolve(),
    currentOtelState?.sdk ? currentOtelState.sdk.shutdown() : Promise.resolve(),
  ])
    .then(() => undefined)
    .finally(() => {
      if (posthogClient === client) posthogClient = null;

      if (otelState === currentOtelState) otelState = null;

      posthogShutdownPromise = null;
    });

  await posthogShutdownPromise;
}

async function emitLog(
  level: LogLevel,
  message: string,
  metadata: LogMetadata | undefined,
  serverLogContext: ServerLogContext | undefined,
): Promise<void> {
  try {
    const currentOtelState = getOtelState();
    if (!currentOtelState) {
      return;
    }

    currentOtelState.logger.emit({
      severityNumber: getLogSeverity(level, currentOtelState.SeverityNumber),
      severityText: level.toUpperCase(),
      body: message,
      attributes: {
        logger: LOG_NAMESPACE,
        ...getBaseLogAttributes(metadata, serverLogContext),
      },
    });
  } catch (error) {
    console.error("Failed to emit log via OpenTelemetry:", error);
  }
}

function getOtlpLogsEndpoint(analyticsConfig: AnalyticsConfig): string {
  return `${analyticsConfig.PUBLIC_POSTHOG_HOST}/i/v1/logs`;
}

function registerShutdownHandlers(): void {
  if (shutdownHandlersRegistered || typeof process === "undefined") {
    return;
  }

  shutdownHandlersRegistered = true;

  const shutdownForSignal = (signal: NodeJS.Signals): void => {
    void shutdownPostHog()
      .catch((error) => {
        console.error(`Failed to shutdown PostHog on ${signal}:`, error);
      })
      .finally(() => {
        process.exit(0);
      });
  };

  process.once("SIGINT", () => {
    shutdownForSignal("SIGINT");
  });

  process.once("SIGTERM", () => {
    shutdownForSignal("SIGTERM");
  });

  process.once("beforeExit", () => {
    void shutdownPostHog().catch((error) => {
      console.error("Failed to shutdown PostHog before exit:", error);
    });
  });
}

function getOtelState(): OtelState | null {
  if (otelState) return otelState;

  const analyticsConfig = getResolvedAnalyticsConfig();
  if (!analyticsConfig) return null;

  const sdk =
    posthogFactories.createSdk?.(analyticsConfig) ??
    new NodeSDK({
      resource: resourceFromAttributes({
        "service.name": LOG_NAMESPACE,
        "deployment.environment": env.PUBLIC_ENV,
      }),
      logRecordProcessors: [
        new BatchLogRecordProcessor(
          new OTLPLogExporter({
            url: getOtlpLogsEndpoint(analyticsConfig),
            headers: {
              Authorization: `Bearer ${analyticsConfig.PUBLIC_POSTHOG_PROJECT_TOKEN}`,
            },
          }),
        ),
      ],
    });

  sdk.start?.();

  otelState = {
    SeverityNumber,
    logger: logs.getLogger(LOG_NAMESPACE),
    sdk,
  };

  return otelState;
}

export function extractPostHogCorrelationFromHeaders(headers: Headers): ServerCorrelation {
  return {
    distinctId: headers.get(POSTHOG_DISTINCT_ID_HEADER) ?? undefined,
    sessionId: headers.get(POSTHOG_SESSION_ID_HEADER) ?? undefined,
  };
}

export function extractPostHogCorrelationFromRequest(request: Request): ServerCorrelation {
  return extractPostHogCorrelationFromHeaders(request.headers);
}

export function capturePostHogServerException(
  error: Error,
  metadata?: LogMetadata,
  correlation?: ServerCorrelation,
): void {
  captureException(error, metadata, correlation);
}

export async function ensurePostHogServerStarted(): Promise<void> {
  getPostHogServer();
  getOtelState();
}

export async function shutdownPostHogServer(): Promise<void> {
  await shutdownPostHog();
}

export function emitPostHogServerLog(
  level: LogLevel,
  message: string,
  metadata?: LogMetadata,
  serverLogContext?: ServerLogContext,
): Promise<void> {
  return emitLog(level, message, metadata, serverLogContext);
}

export function trackPostHogServerEvent(
  event: string,
  metadata: LogMetadata,
  serverLogContext: ServerLogContext,
): void {
  trackEvent(event, metadata, serverLogContext);
}

export function setOtelSdkForTesting(
  sdk: OtelState["sdk"] | null,
  logger: ReturnType<typeof logs.getLogger> | null,
): void {
  otelState = sdk
    ? {
        SeverityNumber,
        logger: logger ?? logs.getLogger(LOG_NAMESPACE),
        sdk,
      }
    : null;
  posthogShutdownPromise = null;
}

export function setPostHogConfigForTesting(config: PostHogConfigOverride): void {
  analyticsConfigOverride = config;
}

export function setPostHogFactoriesForTesting(factories: PostHogFactories): void {
  posthogFactories = factories;
}

export function resetPostHogServerForTesting(): void {
  posthogClient = null;
  otelState = null;
  posthogShutdownPromise = null;
  shutdownHandlersRegistered = false;
  analyticsConfigOverride = null;
  posthogFactories = {};
}

function getLogSeverity(level: LogLevel, severityNumber: typeof SeverityNumber): number {
  switch (level) {
    case "debug":
      return severityNumber.DEBUG;
    case "info":
    case "log":
      return severityNumber.INFO;
    case "warn":
      return severityNumber.WARN;
    case "error":
      return severityNumber.ERROR;
  }
}

function getBaseLogAttributes(
  metadata: LogMetadata | undefined,
  serverLogContext: ServerLogContext | undefined,
): Record<string, unknown> {
  const attributes: Record<string, unknown> = {
    ...metadata,
  };

  const distinctId = getDistinctId(serverLogContext);
  if (distinctId) {
    attributes.posthogDistinctId = distinctId;
  }

  const sessionId = getSessionId(serverLogContext);
  if (sessionId) {
    attributes.posthogSessionId = sessionId;
  }

  if (serverLogContext?.request) {
    const url = new URL(serverLogContext.request.url);
    attributes.requestMethod = serverLogContext.request.method;
    attributes.requestPath = url.pathname;
  }

  return attributes;
}

function getDistinctId(serverLogContext: ServerLogContext | undefined) {
  return (
    serverLogContext?.distinctId ||
    serverLogContext?.request?.headers.get(POSTHOG_DISTINCT_ID_HEADER) ||
    POSTHOG_ANONYMOUS_ID
  );
}

function getSessionId(serverLogContext: ServerLogContext | undefined) {
  return (
    serverLogContext?.sessionId || serverLogContext?.request?.headers.get(POSTHOG_SESSION_ID_HEADER)
  );
}

export type LogMetadata = Record<string | number, unknown>;

/**
 * Extra context needed in order to extract a distinctId for the user on the server. In the browser,
 * this isn't necessary because posthog keeps track of the user in a cookie and sends it
 * automatically when we call window.posthog?.capture or window.posthog?.captureException
 */
export interface ServerLogContext {
  /**
   * On the server, most of the time request should be provided instead of distinctId because
   * request can infer the distinct and session IDs from headers. Explicit values on the context
   * take precedence over headers. On the browser this is irrelevant.
   */
  request?: Request;
  distinctId?: string;
  sessionId?: string;
}

export const postHogServer = {
  captureException,
  emitLog,
  trackEvent,
};
export type PostHogServer = typeof postHogServer;
