import { Context, Layer, Schema } from "effect";
import { decodeUnknownSync } from "@/lib/effect-schema";

export const ServerConfigSchema = Schema.Struct({
  DATABASE_URL: Schema.String,
  BETTER_AUTH_URL: Schema.String,
  BETTER_AUTH_SECRET: Schema.String,
  AGENTMAIL_API_KEY: Schema.String,
  AGENTMAIL_INBOX_ID: Schema.String,
});

export type ServerConfigShape = Schema.Schema.Type<typeof ServerConfigSchema>;

const parseServerConfig = decodeUnknownSync(ServerConfigSchema);

export const serverConfig = parseServerConfig({
  ...process.env,
  ...import.meta.env,
});

export class ServerConfig extends Context.Tag("ServerConfig")<ServerConfig, ServerConfigShape>() {}

export const ServerConfigLive = Layer.succeed(ServerConfig, serverConfig);
