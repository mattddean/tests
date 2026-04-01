import { Layer } from "effect";
import { ServerConfigLive } from "@/server/config/server-config";
import { AuthServiceLive } from "@/server/auth/auth-service";
import { DbLive } from "@/server/db/live";
import { MailerLive } from "@/server/mail/agentmail-mailer";
import { LoggerLive } from "@/server/observability/logger";

export const RootLayer = Layer.mergeAll(
  ServerConfigLive,
  LoggerLive,
  DbLive,
  AuthServiceLive,
  MailerLive,
);
