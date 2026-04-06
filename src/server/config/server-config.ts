import { Context, Layer, Schema } from "effect";

import { decodeUnknownSync } from "@/lib/effect-schema";

export const ServerConfigSchema = Schema.Struct({
  PUBLIC_ENV: Schema.String,
  DATABASE_URL: Schema.String,
  BETTER_AUTH_URL: Schema.String,
  BETTER_AUTH_SECRET: Schema.String,
  AGENTMAIL_API_KEY: Schema.String,
  AGENTMAIL_INBOX_ID: Schema.String,
  VITE_POSTHOG_HOST: Schema.optionalWith(Schema.String, {
    default: () => "",
  }),
  VITE_POSTHOG_PROJECT_TOKEN: Schema.optionalWith(Schema.String, {
    default: () => "",
  }),
  VITE_POSTHOG_ENABLE_RECORDING_CONSOLE_LOG: Schema.optionalWith(Schema.String, {
    default: () => "false",
  }),
  POSTHOG_OTEL_TRACES_URL: Schema.optionalWith(Schema.String, {
    default: () => "",
  }),
});

export type ServerConfigShape = Schema.Schema.Type<typeof ServerConfigSchema>;

const parseServerConfig = decodeUnknownSync(ServerConfigSchema);

export const serverConfig = parseServerConfig({
  ...process.env,
  ...import.meta.env,
});

export class ServerConfig extends Context.Tag("ServerConfig")<ServerConfig, ServerConfigShape>() {}

export const ServerConfigLive = Layer.succeed(ServerConfig, serverConfig);
