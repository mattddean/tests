import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

import {
  QuestionChoiceTableInputSchema,
  TestQuestionTableInputSchema,
  deleteChoiceInputValidator,
  deleteQuestionInputValidator,
  reorderChoicesInputValidator,
  reorderQuestionsInputValidator,
  vStr,
  vStrNullOpt,
} from "@/domains/tests/schema";
import { TestEditorService } from "@/domains/tests/services/test-editor.service";
import { runServerEffect } from "@/server/runtime/run-server-effect";

import { withCurrentUser } from "./shared";

export const addQuestionInput = Schema.extend(
  TestQuestionTableInputSchema.pipe(Schema.pick("testId")),
  Schema.Struct({
    afterQuestionId: vStrNullOpt,
  }),
).pipe(Schema.standardSchemaV1);
export type AddQuestionInput = Schema.Schema.Type<typeof addQuestionInput>;
export const addQuestionAction = createServerFn({ method: "POST" })
  .inputValidator(addQuestionInput)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestEditorService, (service) =>
          service.addQuestion(data.testId, userId, data.afterQuestionId),
        ).pipe(Effect.as({ ok: true })),
      ),
    ),
  );
export type AddQuestionActionResponse = Awaited<ReturnType<typeof addQuestionAction>>;

export const updateQuestionInput = Schema.extend(
  Schema.Struct({
    questionId: vStr,
  }),
  Schema.partial(
    TestQuestionTableInputSchema.pipe(Schema.pick("prompt", "description", "required")),
  ),
).pipe(Schema.standardSchemaV1);
export type UpdateQuestionInput = Schema.Schema.Type<typeof updateQuestionInput>;
export const updateQuestionAction = createServerFn({ method: "POST" })
  .inputValidator(updateQuestionInput)
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
export type UpdateQuestionActionResponse = Awaited<ReturnType<typeof updateQuestionAction>>;

export const reorderQuestionsAction = createServerFn({ method: "POST" })
  .inputValidator(reorderQuestionsInputValidator)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestEditorService, (service) =>
          service.reorderQuestions(data.testId, userId, [...data.questionIds]),
        ).pipe(Effect.as({ ok: true })),
      ),
    ),
  );
export type ReorderQuestionsActionResponse = Awaited<ReturnType<typeof reorderQuestionsAction>>;

export const addChoiceInput = Schema.extend(
  QuestionChoiceTableInputSchema.pipe(Schema.pick("questionId")),
  Schema.Struct({
    afterChoiceId: vStrNullOpt,
  }),
).pipe(Schema.standardSchemaV1);
export type AddChoiceInput = Schema.Schema.Type<typeof addChoiceInput>;
export const addChoiceAction = createServerFn({ method: "POST" })
  .inputValidator(addChoiceInput)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestEditorService, (service) =>
          service.addChoice(data.questionId, userId, data.afterChoiceId),
        ).pipe(Effect.as({ ok: true })),
      ),
    ),
  );
export type AddChoiceActionResponse = Awaited<ReturnType<typeof addChoiceAction>>;

export const updateChoiceInput = Schema.extend(
  Schema.Struct({
    choiceId: vStr,
  }),
  QuestionChoiceTableInputSchema.pipe(Schema.pick("label")),
).pipe(Schema.standardSchemaV1);
export type UpdateChoiceInput = Schema.Schema.Type<typeof updateChoiceInput>;
export const updateChoiceAction = createServerFn({ method: "POST" })
  .inputValidator(updateChoiceInput)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestEditorService, (service) =>
          service.updateChoice(data.choiceId, userId, data.label),
        ).pipe(Effect.as({ ok: true })),
      ),
    ),
  );
export type UpdateChoiceActionResponse = Awaited<ReturnType<typeof updateChoiceAction>>;

export const reorderChoicesAction = createServerFn({ method: "POST" })
  .inputValidator(reorderChoicesInputValidator)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestEditorService, (service) =>
          service.reorderChoices(data.questionId, userId, [...data.choiceIds]),
        ).pipe(Effect.as({ ok: true })),
      ),
    ),
  );
export type ReorderChoicesActionResponse = Awaited<ReturnType<typeof reorderChoicesAction>>;

export const deleteQuestionAction = createServerFn({ method: "POST" })
  .inputValidator(deleteQuestionInputValidator)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestEditorService, (service) =>
          service.deleteQuestion(data.questionId, userId),
        ).pipe(Effect.as({ ok: true })),
      ),
    ),
  );
export type DeleteQuestionActionResponse = Awaited<ReturnType<typeof deleteQuestionAction>>;

export const deleteChoiceAction = createServerFn({ method: "POST" })
  .inputValidator(deleteChoiceInputValidator)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestEditorService, (service) =>
          service.deleteChoice(data.choiceId, userId),
        ).pipe(Effect.as({ ok: true })),
      ),
    ),
  );
export type DeleteChoiceActionResponse = Awaited<ReturnType<typeof deleteChoiceAction>>;
