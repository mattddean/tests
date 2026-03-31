import { createServerFn } from "@tanstack/react-start";
import { requireUser } from "@/features/auth/server";
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

export const getDashboardData = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  return await getDashboard(user.id);
});

export const getTests = createServerFn({ method: "GET" })
  .inputValidator((value: "drafts" | "published" | "shared") => value)
  .handler(async ({ data }) => {
    const user = await requireUser();
    return await getTestsList(user.id, data);
  });

export const createTest = createServerFn({ method: "POST" })
  .inputValidator((value) => createTestInputSchema.parse(value))
  .handler(async ({ data }) => {
    const user = await requireUser();
    return await createTestRecord(user.id, data.title);
  });

export const getTestEditor = createServerFn({ method: "GET" })
  .inputValidator((value) => testIdInputSchema.parse(value))
  .handler(async ({ data }) => {
    const user = await requireUser();
    return await getEditorView(data.testId, user.id);
  });

export const getTestTake = createServerFn({ method: "GET" })
  .inputValidator((value) => testIdInputSchema.parse(value))
  .handler(async ({ data }) => {
    const user = await requireUser();
    return await getTakeView(data.testId, user.id);
  });

export const updateTestMetaAction = createServerFn({ method: "POST" })
  .inputValidator((value) => updateTestMetaInputSchema.parse(value))
  .handler(async ({ data }) => {
    const user = await requireUser();
    return await updateTestMeta(data.testId, user.id, {
      title: data.title,
      description: data.description,
    });
  });

export const addQuestionAction = createServerFn({ method: "POST" })
  .inputValidator((value) => addQuestionInputSchema.parse(value))
  .handler(async ({ data }) => {
    const user = await requireUser();
    await addQuestion(data.testId, user.id, data.afterQuestionId);
    return { ok: true };
  });

export const updateQuestionAction = createServerFn({ method: "POST" })
  .inputValidator((value) => updateQuestionInputSchema.parse(value))
  .handler(async ({ data }) => {
    const user = await requireUser();
    await updateQuestion(data.questionId, user.id, {
      prompt: data.prompt,
      description: data.description,
      required: data.required,
    });
    return { ok: true };
  });

export const reorderQuestionsAction = createServerFn({ method: "POST" })
  .inputValidator((value) => reorderQuestionsInputSchema.parse(value))
  .handler(async ({ data }) => {
    const user = await requireUser();
    await reorderQuestions(data.testId, user.id, data.questionIds);
    return { ok: true };
  });

export const addChoiceAction = createServerFn({ method: "POST" })
  .inputValidator((value) => addChoiceInputSchema.parse(value))
  .handler(async ({ data }) => {
    const user = await requireUser();
    await addChoice(data.questionId, user.id, data.afterChoiceId);
    return { ok: true };
  });

export const updateChoiceAction = createServerFn({ method: "POST" })
  .inputValidator((value) => updateChoiceInputSchema.parse(value))
  .handler(async ({ data }) => {
    const user = await requireUser();
    await updateChoice(data.choiceId, user.id, data.label);
    return { ok: true };
  });

export const reorderChoicesAction = createServerFn({ method: "POST" })
  .inputValidator((value) => reorderChoicesInputSchema.parse(value))
  .handler(async ({ data }) => {
    const user = await requireUser();
    await reorderChoices(data.questionId, user.id, data.choiceIds);
    return { ok: true };
  });

export const deleteQuestionAction = createServerFn({ method: "POST" })
  .inputValidator((value) => deleteQuestionInputSchema.parse(value))
  .handler(async ({ data }) => {
    const user = await requireUser();
    await deleteQuestion(data.questionId, user.id);
    return { ok: true };
  });

export const deleteChoiceAction = createServerFn({ method: "POST" })
  .inputValidator((value) => deleteChoiceInputSchema.parse(value))
  .handler(async ({ data }) => {
    const user = await requireUser();
    await deleteChoice(data.choiceId, user.id);
    return { ok: true };
  });

export const publishTestAction = createServerFn({ method: "POST" })
  .inputValidator((value) => testIdInputSchema.parse(value))
  .handler(async ({ data }) => {
    const user = await requireUser();
    await publishTest(data.testId, user.id);
    return { ok: true };
  });

export const addEditorAction = createServerFn({ method: "POST" })
  .inputValidator((value) => addEditorInputSchema.parse(value))
  .handler(async ({ data }) => {
    const user = await requireUser();
    await addEditor(data.testId, user.id, data.email);
    return { ok: true };
  });

export const removeEditorAction = createServerFn({ method: "POST" })
  .inputValidator((value) => removeEditorInputSchema.parse(value))
  .handler(async ({ data }) => {
    const user = await requireUser();
    await removeEditor(data.testId, user.id, data.userId);
    return { ok: true };
  });

export const saveAnswerAction = createServerFn({ method: "POST" })
  .inputValidator((value) => saveAnswerInputSchema.parse(value))
  .handler(async ({ data }) => {
    const user = await requireUser();
    return await saveAnswer(data.testId, user.id, data.questionId, data.choiceId);
  });

export const submitResponseAction = createServerFn({ method: "POST" })
  .inputValidator((value) => submitResponseInputSchema.parse(value))
  .handler(async ({ data }) => {
    const user = await requireUser();
    return await submitResponse(data.testId, user.id);
  });

export const getResponsesTableData = createServerFn({ method: "GET" })
  .inputValidator((value) =>
    responseSearchSchema.extend({ testId: testIdInputSchema.shape.testId }).parse(value),
  )
  .handler(async ({ data }) => {
    const user = await requireUser();
    const { testId, ...search } = data;
    return await getResponsesTable(testId, user.id, search);
  });

export const getResponseDetail = createServerFn({ method: "GET" })
  .inputValidator((value) => responseDetailInputSchema.parse(value))
  .handler(async ({ data }) => {
    const user = await requireUser();
    return await getResponseReview(data.testId, data.responseId, user.id);
  });

export const getMyResponsesData = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  return await getMyResponses(user.id);
});
