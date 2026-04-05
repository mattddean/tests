import { createServerFn } from "@tanstack/react-start";
import { Effect } from "effect";

import {
  addEditorInputValidator,
  createTestInputValidator,
  removeEditorInputValidator,
  shareTestInputValidator,
  testIdInputValidator,
  updateTestMetaInputValidator,
} from "@/domains/tests/schema";
import { TestAdminService } from "@/domains/tests/services/test-admin.service";
import { runServerEffect } from "@/server/runtime/run-server-effect";

import { withCurrentUser } from "./shared";

export const createTest = createServerFn({ method: "POST" })
  .inputValidator(createTestInputValidator)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestAdminService, (service) => service.createTestRecord(userId, data.title)),
      ),
    ),
  );
export type CreateTestResponse = Awaited<ReturnType<typeof createTest>>;

export const updateTestMetaAction = createServerFn({ method: "POST" })
  .inputValidator(updateTestMetaInputValidator)
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

export const publishTestAction = createServerFn({ method: "POST" })
  .inputValidator(testIdInputValidator)
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

export const addEditorAction = createServerFn({ method: "POST" })
  .inputValidator(addEditorInputValidator)
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

export const removeEditorAction = createServerFn({ method: "POST" })
  .inputValidator(removeEditorInputValidator)
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

export const shareTestAction = createServerFn({ method: "POST" })
  .inputValidator(shareTestInputValidator)
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
