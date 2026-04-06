import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

import { TestEditorService } from "@/domains/tests/services/test-editor.service";
import {
  QuestionChoiceTableInputSchema,
  TestQuestionTableInputSchema,
  deleteChoiceInputValidator,
  deleteQuestionInputValidator,
  reorderChoicesInputValidator,
  reorderQuestionsInputValidator,
} from "@/schemas/entities";
import { vStr, vStrNullOpt } from "@/schemas/primitives";
import { runServerResultEffect } from "@/server/runtime/run-server-result-effect";

import { currentUserIdEffect } from "./shared";

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
    runServerResultEffect(
      Effect.gen(function* () {
        const userId = yield* currentUserIdEffect;
        const testEditorService = yield* TestEditorService;
        yield* testEditorService.addQuestion(data.testId, userId, data.afterQuestionId);
        return { ok: true } as const;
      }),
      { name: "tests.addQuestion" },
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
    runServerResultEffect(
      Effect.gen(function* () {
        const userId = yield* currentUserIdEffect;
        const testEditorService = yield* TestEditorService;
        yield* testEditorService.updateQuestion(data.questionId, userId, {
          prompt: data.prompt,
          description: data.description,
          required: data.required,
        });
        return { ok: true } as const;
      }),
      {
        name: "tests.updateQuestion",
      },
    ),
  );
export type UpdateQuestionActionResponse = Awaited<ReturnType<typeof updateQuestionAction>>;

export const reorderQuestionsAction = createServerFn({ method: "POST" })
  .inputValidator(reorderQuestionsInputValidator)
  .handler(({ data }) =>
    runServerResultEffect(
      Effect.gen(function* () {
        const userId = yield* currentUserIdEffect;
        const testEditorService = yield* TestEditorService;
        yield* testEditorService.reorderQuestions(data.testId, userId, [...data.questionIds]);
        return { ok: true } as const;
      }),
      {
        name: "tests.reorderQuestions",
      },
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
    runServerResultEffect(
      Effect.gen(function* () {
        const userId = yield* currentUserIdEffect;
        const testEditorService = yield* TestEditorService;
        yield* testEditorService.addChoice(data.questionId, userId, data.afterChoiceId);
        return { ok: true } as const;
      }),
      {
        name: "tests.addChoice",
      },
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
    runServerResultEffect(
      Effect.gen(function* () {
        const userId = yield* currentUserIdEffect;
        const testEditorService = yield* TestEditorService;
        yield* testEditorService.updateChoice(data.choiceId, userId, data.label);
        return { ok: true } as const;
      }),
      {
        name: "tests.updateChoice",
      },
    ),
  );
export type UpdateChoiceActionResponse = Awaited<ReturnType<typeof updateChoiceAction>>;

export const reorderChoicesAction = createServerFn({ method: "POST" })
  .inputValidator(reorderChoicesInputValidator)
  .handler(({ data }) =>
    runServerResultEffect(
      Effect.gen(function* () {
        const userId = yield* currentUserIdEffect;
        const testEditorService = yield* TestEditorService;
        yield* testEditorService.reorderChoices(data.questionId, userId, [...data.choiceIds]);
        return { ok: true } as const;
      }),
      {
        name: "tests.reorderChoices",
      },
    ),
  );
export type ReorderChoicesActionResponse = Awaited<ReturnType<typeof reorderChoicesAction>>;

export const deleteQuestionAction = createServerFn({ method: "POST" })
  .inputValidator(deleteQuestionInputValidator)
  .handler(({ data }) =>
    runServerResultEffect(
      Effect.gen(function* () {
        const userId = yield* currentUserIdEffect;
        const testEditorService = yield* TestEditorService;
        yield* testEditorService.deleteQuestion(data.questionId, userId);
        return { ok: true } as const;
      }),
      {
        name: "tests.deleteQuestion",
      },
    ),
  );
export type DeleteQuestionActionResponse = Awaited<ReturnType<typeof deleteQuestionAction>>;

export const deleteChoiceAction = createServerFn({ method: "POST" })
  .inputValidator(deleteChoiceInputValidator)
  .handler(({ data }) =>
    runServerResultEffect(
      Effect.gen(function* () {
        const userId = yield* currentUserIdEffect;
        const testEditorService = yield* TestEditorService;
        yield* testEditorService.deleteChoice(data.choiceId, userId);
        return { ok: true } as const;
      }),
      {
        name: "tests.deleteChoice",
      },
    ),
  );
export type DeleteChoiceActionResponse = Awaited<ReturnType<typeof deleteChoiceAction>>;
