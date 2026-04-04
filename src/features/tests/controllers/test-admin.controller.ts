import { Effect } from "effect";
import { createServerFn } from "@tanstack/react-start";
import { TestAdminService } from "@/domains/tests/services/test-admin.service";
import {
  addEditorInputValidator,
  createTestInputValidator,
  removeEditorInputValidator,
  shareTestInputValidator,
  testIdInputValidator,
  updateTestMetaInputValidator,
} from "@/domains/tests/schema";
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

export const publishTestAction = createServerFn({ method: "POST" })
  .inputValidator(testIdInputValidator)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestAdminService, (service) => service.publishTest(data.testId, userId)).pipe(
          Effect.as({ ok: true }),
        ),
      ),
    ),
  );

export const addEditorAction = createServerFn({ method: "POST" })
  .inputValidator(addEditorInputValidator)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestAdminService, (service) => service.addEditor(data.testId, userId, data.email)).pipe(
          Effect.as({ ok: true }),
        ),
      ),
    ),
  );

export const removeEditorAction = createServerFn({ method: "POST" })
  .inputValidator(removeEditorInputValidator)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestAdminService, (service) => service.removeEditor(data.testId, userId, data.userId)).pipe(
          Effect.as({ ok: true }),
        ),
      ),
    ),
  );

export const shareTestAction = createServerFn({ method: "POST" })
  .inputValidator(shareTestInputValidator)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestAdminService, (service) => service.shareTest(data.testId, userId, data.email)).pipe(
          Effect.as({ ok: true }),
        ),
      ),
    ),
  );
