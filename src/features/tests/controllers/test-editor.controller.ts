import { Effect } from "effect";
import { createServerFn } from "@tanstack/react-start";
import { TestEditorService } from "@/domains/tests/services/test-editor.service";
import {
  parseAddChoiceInput,
  parseAddQuestionInput,
  parseDeleteChoiceInput,
  parseDeleteQuestionInput,
  parseReorderChoicesInput,
  parseReorderQuestionsInput,
  parseUpdateChoiceInput,
  parseUpdateQuestionInput,
} from "@/domains/tests/schema";
import { runServerEffect } from "@/server/runtime/run-server-effect";
import { withCurrentUser } from "./shared";

export const addQuestionAction = createServerFn({ method: "POST" })
  .inputValidator(parseAddQuestionInput)
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
  .inputValidator(parseUpdateQuestionInput)
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
  .inputValidator(parseReorderQuestionsInput)
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
  .inputValidator(parseAddChoiceInput)
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
  .inputValidator(parseUpdateChoiceInput)
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
  .inputValidator(parseReorderChoicesInput)
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
  .inputValidator(parseDeleteQuestionInput)
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
  .inputValidator(parseDeleteChoiceInput)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestEditorService, (service) => service.deleteChoice(data.choiceId, userId)).pipe(
          Effect.as({ ok: true }),
        ),
      ),
    ),
  );
