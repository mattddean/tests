import { Effect } from "effect";
import { createServerFn } from "@tanstack/react-start";
import { TestEditorService } from "@/domains/tests/services/test-editor.service";
import {
  addChoiceInputValidator,
  addQuestionInputValidator,
  deleteChoiceInputValidator,
  deleteQuestionInputValidator,
  reorderChoicesInputValidator,
  reorderQuestionsInputValidator,
  updateChoiceInputValidator,
  updateQuestionInputValidator,
} from "@/domains/tests/schema";
import { runServerEffect } from "@/server/runtime/run-server-effect";
import { withCurrentUser } from "./shared";

export const addQuestionAction = createServerFn({ method: "POST" })
  .inputValidator(addQuestionInputValidator)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestEditorService, (service) => service.addQuestion(data.testId, userId, data.afterQuestionId)).pipe(
          Effect.as({ ok: true }),
        ),
      ),
    ),
  );

export const updateQuestionAction = createServerFn({ method: "POST" })
  .inputValidator(updateQuestionInputValidator)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestEditorService, (service) =>
          service.updateQuestion(data.questionId, userId, {
            prompt: data.prompt,
            description: data.description,
            required: data.required,
          }),
        ).pipe(Effect.as({ ok: true })),
      ),
    ),
  );

export const reorderQuestionsAction = createServerFn({ method: "POST" })
  .inputValidator(reorderQuestionsInputValidator)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestEditorService, (service) => service.reorderQuestions(data.testId, userId, [...data.questionIds])).pipe(
          Effect.as({ ok: true }),
        ),
      ),
    ),
  );

export const addChoiceAction = createServerFn({ method: "POST" })
  .inputValidator(addChoiceInputValidator)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestEditorService, (service) => service.addChoice(data.questionId, userId, data.afterChoiceId)).pipe(
          Effect.as({ ok: true }),
        ),
      ),
    ),
  );

export const updateChoiceAction = createServerFn({ method: "POST" })
  .inputValidator(updateChoiceInputValidator)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestEditorService, (service) => service.updateChoice(data.choiceId, userId, data.label)).pipe(
          Effect.as({ ok: true }),
        ),
      ),
    ),
  );

export const reorderChoicesAction = createServerFn({ method: "POST" })
  .inputValidator(reorderChoicesInputValidator)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestEditorService, (service) => service.reorderChoices(data.questionId, userId, [...data.choiceIds])).pipe(
          Effect.as({ ok: true }),
        ),
      ),
    ),
  );

export const deleteQuestionAction = createServerFn({ method: "POST" })
  .inputValidator(deleteQuestionInputValidator)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestEditorService, (service) => service.deleteQuestion(data.questionId, userId)).pipe(
          Effect.as({ ok: true }),
        ),
      ),
    ),
  );

export const deleteChoiceAction = createServerFn({ method: "POST" })
  .inputValidator(deleteChoiceInputValidator)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestEditorService, (service) => service.deleteChoice(data.choiceId, userId)).pipe(
          Effect.as({ ok: true }),
        ),
      ),
    ),
  );
