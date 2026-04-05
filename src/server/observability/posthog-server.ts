import { trace, type TracerProvider } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { PostHog } from "posthog-node";

import {
  POSTHOG_ANONYMOUS_ID,
  POSTHOG_DISTINCT_ID_HEADER,
  POSTHOG_SESSION_ID_HEADER,
} from "@/lib/posthog";
import { serverConfig } from "@/server/config/server-config";

import { OBSERVABILITY_SERVICE_NAME } from "./tracing";

export type PostHogNode = InstanceType<typeof PostHog>;

type ServerCorrelation = {
  readonly distinctId?: string;
  readonly sessionId?: string;
};

type PostHogServerConfig = {
  readonly host: string;
  readonly projectToken: string;
  readonly tracesUrl: string;
};

type OtelSdkLike = {
  readonly shutdown: () => Promise<void>;
};

type PostHogFactories = {
  readonly createClient?: (config: PostHogServerConfig) => PostHogNode;
  readonly createSdk?: (config: PostHogServerConfig) => OtelSdkLike;
  readonly getTracerProvider?: () => TracerProvider;
};

let posthogClient: PostHogNode | null = null;
let otelSdk: OtelSdkLike | null = null;
let otelTracerProvider: TracerProvider | null = null;
let posthogShutdownPromise: Promise<void> | null = null;
let posthogInitPromise: Promise<void> | null = null;
let shutdownHandlersRegistered = false;
let posthogFactories: PostHogFactories = {};
let posthogConfigOverride: {
  readonly host: string;
  readonly projectToken: string;
  readonly tracesUrl?: string;
} | null = null;

function getServerConfig():
  | {
      readonly host: string;
      readonly projectToken: string;
      readonly tracesUrl?: string;
    }
  | undefined {
  if (posthogConfigOverride) {
    return posthogConfigOverride;
  }

  const host = serverConfig.VITE_POSTHOG_HOST.trim();
  const projectToken = serverConfig.VITE_POSTHOG_PROJECT_TOKEN.trim();
  const tracesUrl = serverConfig.POSTHOG_OTEL_TRACES_URL.trim();

  if (!host || !projectToken) {
    return undefined;
  }

  return {
    host,
    projectToken,
    tracesUrl: tracesUrl || undefined,
  };
}

function getTracingConfig(): PostHogServerConfig | undefined {
  const config = getServerConfig();

  if (!config?.tracesUrl) {
    return undefined;
  }

  return {
    host: config.host,
    projectToken: config.projectToken,
    tracesUrl: config.tracesUrl,
  };
}

export function extractPostHogCorrelationFromHeaders(headers: Headers): ServerCorrelation {
  const distinctId = headers.get(POSTHOG_DISTINCT_ID_HEADER) ?? undefined;
  const sessionId = headers.get(POSTHOG_SESSION_ID_HEADER) ?? undefined;

  return {
    distinctId,
    sessionId,
  };
}

export function extractPostHogCorrelationFromRequest(request: Request): ServerCorrelation {
  return extractPostHogCorrelationFromHeaders(request.headers);
}

export function getPostHogDistinctId(headers: Headers): string {
  return extractPostHogCorrelationFromHeaders(headers).distinctId ?? POSTHOG_ANONYMOUS_ID;
}

export function getPostHogServer(): PostHogNode | undefined {
  if (posthogClient) {
    return posthogClient;
  }

  const config = getServerConfig();
  if (!config) {
    return undefined;
  }

  registerShutdownHandlers();

  posthogClient =
    posthogFactories.createClient?.({
      host: config.host,
      projectToken: config.projectToken,
      tracesUrl: config.tracesUrl ?? "",
    }) ??
    new PostHog(config.projectToken, {
      host: config.host,
      flushAt: 1,
      flushInterval: 0,
      enableExceptionAutocapture: true,
    });

  return posthogClient;
}

export async function ensurePostHogServerStarted(): Promise<void> {
  if (posthogClient || otelSdk) {
    return;
  }

  if (posthogInitPromise) {
    await posthogInitPromise;
    return;
  }

  posthogInitPromise = Promise.resolve().then(() => {
    getPostHogServer();

    const tracingConfig = getTracingConfig();
    if (!tracingConfig || otelSdk) {
      return;
    }

    registerShutdownHandlers();

    otelSdk =
      posthogFactories.createSdk?.(tracingConfig) ??
      new NodeSDK({
        resource: resourceFromAttributes({
          "service.name": OBSERVABILITY_SERVICE_NAME,
        }),
        traceExporter: new OTLPTraceExporter({
          url: tracingConfig.tracesUrl,
          headers: {
            Authorization: `Bearer ${tracingConfig.projectToken}`,
          },
        }),
      });

    if (otelSdk instanceof NodeSDK) {
      otelSdk.start();
    }

    otelTracerProvider = posthogFactories.getTracerProvider?.() ?? trace.getTracerProvider();
  });

  try {
    await posthogInitPromise;
  } finally {
    posthogInitPromise = null;
  }
}

export function getOtelTracerProvider(): TracerProvider | null {
  return otelTracerProvider;
}

export function capturePostHogServerException(
  error: Error,
  metadata?: Record<string, unknown>,
  correlation?: ServerCorrelation,
): void {
  const distinctId = correlation?.distinctId ?? POSTHOG_ANONYMOUS_ID;
  const sessionId = correlation?.sessionId;

  try {
    getPostHogServer()?.captureException(error, distinctId, {
      ...metadata,
      ...(sessionId ? { $session_id: sessionId } : {}),
    });
  } catch (posthogError) {
    console.error("Failed to capture exception in PostHog:", posthogError);
  }
}

export async function shutdownPostHogServer(): Promise<void> {
  if (!posthogClient && !otelSdk) {
    return;
  }

  if (posthogShutdownPromise) {
    await posthogShutdownPromise;
    return;
  }

  const client = posthogClient;
  const sdk = otelSdk;
  const tracerProvider = otelTracerProvider;

  posthogShutdownPromise = Promise.all([
    client ? Promise.resolve(client.shutdown()) : Promise.resolve(),
    sdk ? sdk.shutdown() : Promise.resolve(),
  ])
    .then(() => undefined)
    .finally(() => {
      if (posthogClient === client) {
        posthogClient = null;
      }

      if (otelSdk === sdk) {
        otelSdk = null;
      }

      if (otelTracerProvider === tracerProvider) {
        otelTracerProvider = null;
      }

      posthogShutdownPromise = null;
    });

  await posthogShutdownPromise;
}

function registerShutdownHandlers(): void {
  if (shutdownHandlersRegistered || typeof process === "undefined") {
    return;
  }

  shutdownHandlersRegistered = true;

  const shutdownForSignal = (signal: NodeJS.Signals): void => {
    void shutdownPostHogServer()
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
    void shutdownPostHogServer().catch((error) => {
      console.error("Failed to shutdown PostHog before exit:", error);
    });
  });
}

export function setPostHogServerForTesting(client: PostHogNode | null): void {
  posthogClient = client;
}

export function setOtelSdkForTesting(
  sdk: OtelSdkLike | null,
  tracerProvider: TracerProvider | null = otelTracerProvider,
): void {
  otelSdk = sdk;
  otelTracerProvider = tracerProvider;
}

export function setPostHogFactoriesForTesting(factories: PostHogFactories): void {
  posthogFactories = factories;
}

export function setPostHogConfigForTesting(
  config: {
    readonly host: string;
    readonly projectToken: string;
    readonly tracesUrl?: string;
  } | null,
): void {
  posthogConfigOverride = config;
}

export function resetPostHogServerForTesting(): void {
  posthogClient = null;
  otelSdk = null;
  otelTracerProvider = null;
  posthogShutdownPromise = null;
  posthogInitPromise = null;
  posthogFactories = {};
  posthogConfigOverride = null;
}
