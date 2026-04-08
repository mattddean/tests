import * as OtelResource from "@effect/opentelemetry/Resource";
import * as OtelTracer from "@effect/opentelemetry/Tracer";
import { Layer, ManagedRuntime } from "effect";

import { TestAdminServiceLive } from "@/domains/tests/services/test-admin.service";
import { TestEditorServiceLive } from "@/domains/tests/services/test-editor.service";
import { TestReadServiceLive } from "@/domains/tests/services/test-read.service";
import { TestTakingServiceLive } from "@/domains/tests/services/test-taking.service";
import { AuthServiceLive } from "@/server/auth/auth-service";
import { DbLive } from "@/server/db/live";
import { MailerLive } from "@/server/mail/agentmail-mailer";
import { OBSERVABILITY_SERVICE_NAME } from "@/server/observability/tracing";

const BaseLayer = Layer.mergeAll(DbLive, AuthServiceLive, MailerLive);
const ObservabilityLayer = OtelTracer.layerGlobal.pipe(
  Layer.provideMerge(
    OtelResource.layer({
      serviceName: OBSERVABILITY_SERVICE_NAME,
    }),
  ),
);

const TestReadServiceLayer = TestReadServiceLive.pipe(Layer.provide(DbLive));
const TestEditorServiceLayer = TestEditorServiceLive.pipe(Layer.provide(DbLive));
const TestTakingServiceLayer = TestTakingServiceLive.pipe(Layer.provide(DbLive));
const TestAdminServiceLayer = TestAdminServiceLive.pipe(
  Layer.provide(Layer.mergeAll(DbLive, MailerLive)),
);

export const RootLayer = Layer.mergeAll(
  BaseLayer,
  ObservabilityLayer,
  TestReadServiceLayer,
  TestEditorServiceLayer,
  TestTakingServiceLayer,
  TestAdminServiceLayer,
);

// This runtime is created once at module scope, so services built from RootLayer
// are shared across requests for the lifetime of the server process or dev module instance.
export const rootRuntime = ManagedRuntime.make(RootLayer);
