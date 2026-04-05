import { createInsertSchema } from "drizzle-orm/effect-schema";
import { Schema } from "effect";

import {
  questionChoice,
  responseAnswer,
  test,
  testEmailAccess,
  testQuestion,
  testResponse,
  testUser,
} from "@/server/db/schema";

import {
  ResponseStatusSchema,
  TestStatusSchema,
  vChoiceLabel,
  vDescriptionNull,
  vEmailLower,
  vPrompt,
  vStr,
  vTitle,
} from "./primitives";

export const TestTableInputSchema = createInsertSchema(test, {
  id: () => vStr,
  slug: () => vStr,
  title: () => vTitle,
  description: () => vDescriptionNull,
  status: () => TestStatusSchema,
}).pipe(Schema.omit("id", "slug", "status", "publishedAt", "createdAt", "updatedAt"));

export const TestQuestionTableInputSchema = createInsertSchema(testQuestion, {
  id: () => vStr,
  testId: () => vStr,
  prompt: () => vPrompt,
  description: () => vDescriptionNull,
  type: () => Schema.Literal("multiple_choice"),
}).pipe(Schema.omit("id", "position", "createdAt", "updatedAt"));

export const ReorderQuestionsInputSchema = Schema.Struct({
  testId: vStr,
  questionIds: Schema.Array(vStr),
});
export const reorderQuestionsInputValidator = Schema.standardSchemaV1(ReorderQuestionsInputSchema);

export const QuestionChoiceTableInputSchema = createInsertSchema(questionChoice, {
  id: () => vStr,
  questionId: () => vStr,
  label: () => vChoiceLabel,
}).pipe(Schema.omit("id", "position", "createdAt", "updatedAt"));

export const ReorderChoicesInputSchema = Schema.Struct({
  questionId: vStr,
  choiceIds: Schema.Array(vStr),
});
export const reorderChoicesInputValidator = Schema.standardSchemaV1(ReorderChoicesInputSchema);

export const DeleteQuestionInputSchema = Schema.Struct({
  questionId: vStr,
});
export const deleteQuestionInputValidator = Schema.standardSchemaV1(DeleteQuestionInputSchema);

export const DeleteChoiceInputSchema = Schema.Struct({
  choiceId: vStr,
});
export const deleteChoiceInputValidator = Schema.standardSchemaV1(DeleteChoiceInputSchema);

export const TestEmailAccessTableInputSchema = createInsertSchema(testEmailAccess, {
  id: () => vStr,
  testId: () => vStr,
  email: () => vEmailLower,
  role: () => Schema.String,
  grantedByUserId: () => vStr,
}).pipe(Schema.omit("id", "role", "grantedByUserId", "createdAt", "updatedAt", "lastSentAt"));

export const TestUserTableInputSchema = createInsertSchema(testUser, {
  testId: () => vStr,
  userId: () => vStr,
  role: () => Schema.String,
  grantedByUserId: () => vStr,
}).pipe(Schema.omit("role", "grantedByUserId", "createdAt"));

export const TestResponseTableInputSchema = createInsertSchema(testResponse, {
  id: () => vStr,
  testId: () => vStr,
  userId: () => vStr,
  status: () => ResponseStatusSchema,
}).pipe(
  Schema.omit(
    "id",
    "userId",
    "status",
    "startedAt",
    "submittedAt",
    "lastAutosavedAt",
    "createdAt",
    "updatedAt",
  ),
);

export const ResponseAnswerTableInputSchema = createInsertSchema(responseAnswer, {
  id: () => vStr,
  responseId: () => vStr,
  questionId: () => vStr,
  choiceId: () => vStr,
}).pipe(Schema.omit("id", "responseId", "createdAt", "updatedAt"));
