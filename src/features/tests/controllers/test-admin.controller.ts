import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

import { TestAdminService } from "@/domains/tests/services/test-admin.service";
import {
  TestEmailAccessTableInputSchema,
  TestResponseTableInputSchema,
  TestTableInputSchema,
  TestUserTableInputSchema,
} from "@/schemas/entities";
import { vStr } from "@/schemas/primitives";
import { runServerResultEffect } from "@/server/runtime/run-server-result-effect";

import { currentUserIdEffect } from "./shared";

export const createTestInput = TestTableInputSchema.pipe(
  Schema.pick("title"),
  Schema.standardSchemaV1,
);
export type CreateTestInput = Schema.Schema.Type<typeof createTestInput>;
export const createTest = createServerFn({ method: "POST" })
  .inputValidator(createTestInput)
  .handler(({ data }) =>
    runServerResultEffect(
      Effect.gen(function* () {
        const userId = yield* currentUserIdEffect;
        const testAdminService = yield* TestAdminService;
        return yield* testAdminService.createTestRecord(userId, data.title);
      }),
      { name: "tests.createTest" },
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
    runServerResultEffect(
      Effect.gen(function* () {
        const userId = yield* currentUserIdEffect;
        const testAdminService = yield* TestAdminService;
        yield* testAdminService.updateTestMeta(data.testId, userId, {
          title: data.title,
          description: data.description,
        });
      }),
      { name: "tests.updateTestMeta" },
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
    runServerResultEffect(
      Effect.gen(function* () {
        const userId = yield* currentUserIdEffect;
        const testAdminService = yield* TestAdminService;
        yield* testAdminService.publishTest(data.testId, userId);
      }),
      { name: "tests.publishTest" },
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
    runServerResultEffect(
      Effect.gen(function* () {
        const userId = yield* currentUserIdEffect;
        const testAdminService = yield* TestAdminService;
        yield* testAdminService.addEditor(data.testId, userId, data.email);
      }),
      { name: "tests.addEditor" },
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
    runServerResultEffect(
      Effect.gen(function* () {
        const userId = yield* currentUserIdEffect;
        const testAdminService = yield* TestAdminService;
        yield* testAdminService.removeEditor(data.testId, userId, data.userId);
      }),
      { name: "tests.removeEditor" },
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
    runServerResultEffect(
      Effect.gen(function* () {
        const userId = yield* currentUserIdEffect;
        const testAdminService = yield* TestAdminService;
        yield* testAdminService.shareTest(data.testId, userId, data.email);
      }),
      { name: "tests.shareTest" },
    ),
  );
export type ShareTestActionResponse = Awaited<ReturnType<typeof shareTestAction>>;
