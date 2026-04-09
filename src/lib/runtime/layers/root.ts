import * as OtelResource from "@effect/opentelemetry/Resource";
import * as OtelTracer from "@effect/opentelemetry/Tracer";
import { Layer, ManagedRuntime } from "effect";

import { DbLive } from "@/db/live";
import { AuthServiceLive } from "@/lib/auth/service";
import { OBSERVABILITY_SERVICE_NAME } from "@/lib/observability/tracing";
import { MailerLive } from "@/services/agentmail-mailer";
import { TestAdminServiceLive } from "@/services/test-admin.service";
import { TestEditorServiceLive } from "@/services/test-editor.service";
import { TestReadServiceLive } from "@/services/test-read.service";
import { TestTakingServiceLive } from "@/services/test-taking.service";

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
