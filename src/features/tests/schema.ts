import { z } from "zod";

export const testStatusSchema = z.enum(["draft", "published", "archived"]);
export const responseStatusSchema = z.enum(["draft", "submitted"]);

export const createTestInputSchema = z.object({
  title: z.string().trim().min(1).max(120).default("Untitled test"),
});

export const updateTestMetaInputSchema = z.object({
  testId: z.string(),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).nullable(),
});

export const addQuestionInputSchema = z.object({
  testId: z.string(),
  afterQuestionId: z.string().nullable().optional(),
});

export const updateQuestionInputSchema = z.object({
  questionId: z.string(),
  prompt: z.string().trim().min(1).max(1000).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  required: z.boolean().optional(),
});

export const reorderQuestionsInputSchema = z.object({
  testId: z.string(),
  questionIds: z.array(z.string()).min(1),
});

export const addChoiceInputSchema = z.object({
  questionId: z.string(),
  afterChoiceId: z.string().nullable().optional(),
});

export const updateChoiceInputSchema = z.object({
  choiceId: z.string(),
  label: z.string().trim().min(1).max(500),
});

export const reorderChoicesInputSchema = z.object({
  questionId: z.string(),
  choiceIds: z.array(z.string()).min(1),
});

export const deleteQuestionInputSchema = z.object({
  questionId: z.string(),
});

export const deleteChoiceInputSchema = z.object({
  choiceId: z.string(),
});

export const addEditorInputSchema = z.object({
  testId: z.string(),
  email: z.email().transform((value) => value.toLowerCase()),
});

export const removeEditorInputSchema = z.object({
  testId: z.string(),
  userId: z.string(),
});

export const testIdInputSchema = z.object({
  testId: z.string(),
});

export const responseSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  query: z.string().default(""),
  status: z.enum(["all", "draft", "submitted"]).default("all"),
  sortBy: z.enum(["startedAt", "submittedAt"]).default("submittedAt"),
  direction: z.enum(["asc", "desc"]).default("desc"),
});

export const responseDetailInputSchema = z.object({
  testId: z.string(),
  responseId: z.string(),
});

export const saveAnswerInputSchema = z.object({
  testId: z.string(),
  questionId: z.string(),
  choiceId: z.string(),
});

export const submitResponseInputSchema = z.object({
  testId: z.string(),
});
