import { Layer } from "effect";
import { ServerConfigLive } from "@/server/config/server-config";
import { AuthServiceLive } from "@/server/auth/auth-service";
import { DbLive } from "@/server/db/live";
import { MailerLive } from "@/server/mail/agentmail-mailer";
import { LoggerLive } from "@/server/observability/logger";
import { TestAdminServiceLive } from "@/domains/tests/services/test-admin.service";
import { TestEditorServiceLive } from "@/domains/tests/services/test-editor.service";
import { TestReadServiceLive } from "@/domains/tests/services/test-read.service";
import { TestTakingServiceLive } from "@/domains/tests/services/test-taking.service";

const BaseLayer = Layer.mergeAll(
  ServerConfigLive,
  LoggerLive,
  DbLive,
  AuthServiceLive,
  MailerLive,
);

const TestReadServiceLayer = TestReadServiceLive.pipe(Layer.provide(DbLive));
const TestEditorServiceLayer = TestEditorServiceLive.pipe(Layer.provide(DbLive));
const TestTakingServiceLayer = TestTakingServiceLive.pipe(Layer.provide(DbLive));
const TestAdminServiceLayer = TestAdminServiceLive.pipe(
  Layer.provide(Layer.mergeAll(DbLive, MailerLive, ServerConfigLive)),
);

export const RootLayer = Layer.mergeAll(
  BaseLayer,
  TestReadServiceLayer,
  TestEditorServiceLayer,
  TestTakingServiceLayer,
  TestAdminServiceLayer,
);
