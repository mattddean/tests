import { Effect } from "effect";
import { createServerFn } from "@tanstack/react-start";
import { TestAdminService } from "@/domains/tests/services/test-admin.service";
import {
  parseAddEditorInput,
  parseCreateTestInput,
  parseRemoveEditorInput,
  parseShareTestInput,
  parseTestIdInput,
  parseUpdateTestMetaInput,
} from "@/domains/tests/schema";
import { runServerEffect } from "@/server/runtime/run-server-effect";
import { withCurrentUser } from "./shared";

export const createTest = createServerFn({ method: "POST" })
  .inputValidator(parseCreateTestInput)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestAdminService, (service) => service.createTestRecord(userId, data.title)),
      ),
    ),
  );

export const updateTestMetaAction = createServerFn({ method: "POST" })
  .inputValidator(parseUpdateTestMetaInput)
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
  .inputValidator(parseTestIdInput)
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
  .inputValidator(parseAddEditorInput)
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
  .inputValidator(parseRemoveEditorInput)
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
  .inputValidator(parseShareTestInput)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestAdminService, (service) => service.shareTest(data.testId, userId, data.email)).pipe(
          Effect.as({ ok: true }),
        ),
      ),
    ),
  );
