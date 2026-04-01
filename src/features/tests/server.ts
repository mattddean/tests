import { Effect } from "effect";
import { createServerFn } from "@tanstack/react-start";
import { runServerEffect } from "@/backend/effect";
import { requireUserEffect, type SessionUser } from "@/features/auth/server";
import {
  addChoiceInputSchema,
  addEditorInputSchema,
  addQuestionInputSchema,
  createTestInputSchema,
  deleteChoiceInputSchema,
  deleteQuestionInputSchema,
  removeEditorInputSchema,
  reorderChoicesInputSchema,
  reorderQuestionsInputSchema,
  responseDetailInputSchema,
  responseSearchSchema,
  saveAnswerInputSchema,
  submitResponseInputSchema,
  testIdInputSchema,
  updateChoiceInputSchema,
  updateQuestionInputSchema,
  updateTestMetaInputSchema,
} from "./schema";
import {
  addChoice,
  addEditor,
  addQuestion,
  createTestRecord,
  deleteChoice,
  deleteQuestion,
  getDashboard,
  getEditorView,
  getMyResponses,
  getResponseReview,
  getResponsesTable,
  getTakeView,
  getTestsList,
  publishTest,
  removeEditor,
  reorderChoices,
  reorderQuestions,
  saveAnswer,
  submitResponse,
  updateChoice,
  updateQuestion,
  updateTestMeta,
} from "./data";
export { shareTestAction } from "./actions/share-test-action";

function withUser<A>(run: (user: SessionUser) => Effect.Effect<A, any, any>) {
  return Effect.gen(function* () {
    const user = yield* requireUserEffect;
    return yield* run(user);
  });
}

export const getDashboardData = createServerFn({ method: "GET" }).handler(() =>
  runServerEffect(withUser((user) => getDashboard(user.id))),
);

export const getTests = createServerFn({ method: "GET" })
  .inputValidator((value: "drafts" | "published" | "shared") => value)
  .handler(({ data }) => runServerEffect(withUser((user) => getTestsList(user.id, data))));

export const createTest = createServerFn({ method: "POST" })
  .inputValidator((value) => createTestInputSchema.parse(value))
  .handler(({ data }) => runServerEffect(withUser((user) => createTestRecord(user.id, data.title))));

export const getTestEditor = createServerFn({ method: "GET" })
  .inputValidator((value) => testIdInputSchema.parse(value))
  .handler(({ data }) => runServerEffect(withUser((user) => getEditorView(data.testId, user.id))));

export const getTestTake = createServerFn({ method: "GET" })
  .inputValidator((value) => testIdInputSchema.parse(value))
  .handler(({ data }) => runServerEffect(withUser((user) => getTakeView(data.testId, user.id))));

export const updateTestMetaAction = createServerFn({ method: "POST" })
  .inputValidator((value) => updateTestMetaInputSchema.parse(value))
  .handler(({ data }) =>
    runServerEffect(
      withUser((user) =>
        updateTestMeta(data.testId, user.id, {
          title: data.title,
          description: data.description,
        }),
      ),
    ),
  );

export const addQuestionAction = createServerFn({ method: "POST" })
  .inputValidator((value) => addQuestionInputSchema.parse(value))
  .handler(({ data }) =>
    runServerEffect(
      withUser((user) => addQuestion(data.testId, user.id, data.afterQuestionId).pipe(Effect.as({ ok: true }))),
    ),
  );

export const updateQuestionAction = createServerFn({ method: "POST" })
  .inputValidator((value) => updateQuestionInputSchema.parse(value))
  .handler(({ data }) =>
    runServerEffect(
      withUser((user) =>
        updateQuestion(data.questionId, user.id, {
          prompt: data.prompt,
          description: data.description,
          required: data.required,
        }).pipe(Effect.as({ ok: true })),
      ),
    ),
  );

export const reorderQuestionsAction = createServerFn({ method: "POST" })
  .inputValidator((value) => reorderQuestionsInputSchema.parse(value))
  .handler(({ data }) =>
    runServerEffect(
      withUser((user) => reorderQuestions(data.testId, user.id, data.questionIds).pipe(Effect.as({ ok: true }))),
    ),
  );

export const addChoiceAction = createServerFn({ method: "POST" })
  .inputValidator((value) => addChoiceInputSchema.parse(value))
  .handler(({ data }) =>
    runServerEffect(
      withUser((user) => addChoice(data.questionId, user.id, data.afterChoiceId).pipe(Effect.as({ ok: true }))),
    ),
  );

export const updateChoiceAction = createServerFn({ method: "POST" })
  .inputValidator((value) => updateChoiceInputSchema.parse(value))
  .handler(({ data }) =>
    runServerEffect(withUser((user) => updateChoice(data.choiceId, user.id, data.label).pipe(Effect.as({ ok: true })))),
  );

export const reorderChoicesAction = createServerFn({ method: "POST" })
  .inputValidator((value) => reorderChoicesInputSchema.parse(value))
  .handler(({ data }) =>
    runServerEffect(
      withUser((user) => reorderChoices(data.questionId, user.id, data.choiceIds).pipe(Effect.as({ ok: true }))),
    ),
  );

export const deleteQuestionAction = createServerFn({ method: "POST" })
  .inputValidator((value) => deleteQuestionInputSchema.parse(value))
  .handler(({ data }) =>
    runServerEffect(withUser((user) => deleteQuestion(data.questionId, user.id).pipe(Effect.as({ ok: true })))),
  );

export const deleteChoiceAction = createServerFn({ method: "POST" })
  .inputValidator((value) => deleteChoiceInputSchema.parse(value))
  .handler(({ data }) =>
    runServerEffect(withUser((user) => deleteChoice(data.choiceId, user.id).pipe(Effect.as({ ok: true })))),
  );

export const publishTestAction = createServerFn({ method: "POST" })
  .inputValidator((value) => testIdInputSchema.parse(value))
  .handler(({ data }) =>
    runServerEffect(withUser((user) => publishTest(data.testId, user.id).pipe(Effect.as({ ok: true })))),
  );

export const addEditorAction = createServerFn({ method: "POST" })
  .inputValidator((value) => addEditorInputSchema.parse(value))
  .handler(({ data }) =>
    runServerEffect(withUser((user) => addEditor(data.testId, user.id, data.email).pipe(Effect.as({ ok: true })))),
  );

export const removeEditorAction = createServerFn({ method: "POST" })
  .inputValidator((value) => removeEditorInputSchema.parse(value))
  .handler(({ data }) =>
    runServerEffect(withUser((user) => removeEditor(data.testId, user.id, data.userId).pipe(Effect.as({ ok: true })))),
  );

export const saveAnswerAction = createServerFn({ method: "POST" })
  .inputValidator((value) => saveAnswerInputSchema.parse(value))
  .handler(({ data }) =>
    runServerEffect(withUser((user) => saveAnswer(data.testId, user.id, data.questionId, data.choiceId))),
  );

export const submitResponseAction = createServerFn({ method: "POST" })
  .inputValidator((value) => submitResponseInputSchema.parse(value))
  .handler(({ data }) => runServerEffect(withUser((user) => submitResponse(data.testId, user.id))));

export const getResponsesTableData = createServerFn({ method: "GET" })
  .inputValidator((value) =>
    responseSearchSchema.extend({ testId: testIdInputSchema.shape.testId }).parse(value),
  )
  .handler(({ data }) =>
    runServerEffect(
      withUser((user) => {
        const { testId, ...search } = data;
        return getResponsesTable(testId, user.id, search);
      }),
    ),
  );

export const getResponseDetail = createServerFn({ method: "GET" })
  .inputValidator((value) => responseDetailInputSchema.parse(value))
  .handler(({ data }) =>
    runServerEffect(withUser((user) => getResponseReview(data.testId, data.responseId, user.id))),
  );

export const getMyResponsesData = createServerFn({ method: "GET" }).handler(() =>
  runServerEffect(withUser((user) => getMyResponses(user.id))),
);
