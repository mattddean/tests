import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

import {
  TestEmailAccessTableInputSchema,
  TestResponseTableInputSchema,
  TestTableInputSchema,
  TestUserTableInputSchema,
  vStr,
} from "@/domains/tests/schema";
import { TestAdminService } from "@/domains/tests/services/test-admin.service";
import { runServerEffect } from "@/server/runtime/run-server-effect";

import { withCurrentUser } from "./shared";

export const createTestInput = TestTableInputSchema.pipe(
  Schema.pick("title"),
  Schema.standardSchemaV1,
);
export type CreateTestInput = Schema.Schema.Type<typeof createTestInput>;
export const createTest = createServerFn({ method: "POST" })
  .inputValidator(createTestInput)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestAdminService, (service) => service.createTestRecord(userId, data.title)),
      ),
    ),
  );
export type CreateTestResponse = Awaited<ReturnType<typeof createTest>>;

export const updateTestMetaInput = Schema.extend(
  Schema.Struct({
    testId: vStr,
  }),
  TestTableInputSchema.pipe(Schema.pick("title", "description")),
).pipe(Schema.standardSchemaV1);
export type UpdateTestMetaInput = Schema.Schema.Type<typeof updateTestMetaInput>;
export const updateTestMetaAction = createServerFn({ method: "POST" })
  .inputValidator(updateTestMetaInput)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestAdminService, (service) =>
          service.updateTestMeta(data.testId, userId, {
            title: data.title,
            description: data.description,
          }),
        ).pipe(Effect.as({ ok: true })),
      ),
    ),
  );
export type UpdateTestMetaActionResponse = Awaited<ReturnType<typeof updateTestMetaAction>>;

export const publishTestInput = TestResponseTableInputSchema.pipe(
  Schema.pick("testId"),
  Schema.standardSchemaV1,
);
export type PublishTestInput = Schema.Schema.Type<typeof publishTestInput>;
export const publishTestAction = createServerFn({ method: "POST" })
  .inputValidator(publishTestInput)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestAdminService, (service) =>
          service.publishTest(data.testId, userId),
        ).pipe(Effect.as({ ok: true })),
      ),
    ),
  );
export type PublishTestActionResponse = Awaited<ReturnType<typeof publishTestAction>>;

export const addEditorInput = TestEmailAccessTableInputSchema.pipe(
  Schema.pick("testId", "email"),
  Schema.standardSchemaV1,
);
export type AddEditorInput = Schema.Schema.Type<typeof addEditorInput>;
export const addEditorAction = createServerFn({ method: "POST" })
  .inputValidator(addEditorInput)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestAdminService, (service) =>
          service.addEditor(data.testId, userId, data.email),
        ).pipe(Effect.as({ ok: true })),
      ),
    ),
  );
export type AddEditorActionResponse = Awaited<ReturnType<typeof addEditorAction>>;

export const removeEditorInput = TestUserTableInputSchema.pipe(
  Schema.pick("testId", "userId"),
  Schema.standardSchemaV1,
);
export type RemoveEditorInput = Schema.Schema.Type<typeof removeEditorInput>;
export const removeEditorAction = createServerFn({ method: "POST" })
  .inputValidator(removeEditorInput)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestAdminService, (service) =>
          service.removeEditor(data.testId, userId, data.userId),
        ).pipe(Effect.as({ ok: true })),
      ),
    ),
  );
export type RemoveEditorActionResponse = Awaited<ReturnType<typeof removeEditorAction>>;

export const shareTestInput = TestEmailAccessTableInputSchema.pipe(
  Schema.pick("testId", "email"),
  Schema.standardSchemaV1,
);
export type ShareTestInput = Schema.Schema.Type<typeof shareTestInput>;
export const shareTestAction = createServerFn({ method: "POST" })
  .inputValidator(shareTestInput)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestAdminService, (service) =>
          service.shareTest(data.testId, userId, data.email),
        ).pipe(Effect.as({ ok: true })),
      ),
    ),
  );
export type ShareTestActionResponse = Awaited<ReturnType<typeof shareTestAction>>;
