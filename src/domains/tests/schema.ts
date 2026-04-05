import { createInsertSchema, createUpdateSchema } from "drizzle-orm/effect-schema";
import { Schema } from "effect";

import { decodeUnknownSync } from "@/lib/effect-schema";
import {
  questionChoice,
  responseAnswer,
  test,
  testEmailAccess,
  testQuestion,
  testResponse,
  testUser,
} from "@/server/db/schema";

type Infer<S extends Schema.Schema.AnyNoContext> = Schema.Schema.Type<S>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asOptionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function oneOf<T extends string>(value: unknown, values: ReadonlyArray<T>, fallback: T): T {
  return typeof value === "string" && values.includes(value as T) ? (value as T) : fallback;
}

function opt<S extends Schema.Schema.AnyNoContext>(schema: S) {
  return Schema.optional(schema);
}

function nullOpt<S extends Schema.Schema.AnyNoContext>(schema: S) {
  return Schema.optional(Schema.NullOr(schema));
}

function makeUnknownParser<S extends Schema.Schema.AnyNoContext>(
  schema: S,
  normalize: (input: unknown) => Infer<S>,
) {
  const decode = decodeUnknownSync(schema);
  return (input: unknown): Infer<S> => decode(normalize(input));
}

export const TestStatusSchema = Schema.Literal("draft", "published", "archived");
export const ResponseStatusSchema = Schema.Literal("draft", "submitted");
export const TestScopeSchema = Schema.Literal("drafts", "published", "shared");
export const ResponsesStatusFilterSchema = Schema.Literal("all", "draft", "submitted");
export const ResponsesSortBySchema = Schema.Literal("startedAt", "submittedAt");
export const SortDirectionSchema = Schema.Literal("asc", "desc");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const vStrTrim = Schema.String.pipe(Schema.compose(Schema.Trim));
export const vStr = Schema.String.pipe(Schema.compose(Schema.Trim), Schema.nonEmptyString());
export const vStrTrimOpt = opt(vStrTrim);
export const vStrNullOpt = nullOpt(vStr);
export const vStrLower = Schema.String.pipe(
  Schema.compose(Schema.Trim),
  Schema.compose(Schema.Lowercase),
);
export const vEmailLower = Schema.String.pipe(
  Schema.compose(Schema.Trim),
  Schema.compose(Schema.Lowercase),
  Schema.pattern(emailPattern),
);
export const vTitle = Schema.String.pipe(
  Schema.compose(Schema.Trim),
  Schema.nonEmptyString(),
  Schema.maxLength(120),
);
export const vDescription = Schema.String.pipe(Schema.compose(Schema.Trim), Schema.maxLength(2000));
export const vDescriptionNull = Schema.NullOr(vDescription);
export const vDescriptionNullOpt = opt(vDescriptionNull);
export const vPrompt = Schema.String.pipe(
  Schema.compose(Schema.Trim),
  Schema.nonEmptyString(),
  Schema.maxLength(1000),
);
export const vPromptOpt = opt(vPrompt);
export const vChoiceLabel = Schema.String.pipe(
  Schema.compose(Schema.Trim),
  Schema.nonEmptyString(),
  Schema.maxLength(500),
);
export const vBooleanOpt = opt(Schema.Boolean);

export const CreateTestInputSchema = createInsertSchema(test, {
  id: () => vStr,
  slug: () => vStr,
  title: () => vTitle,
  description: () => vDescription,
  status: () => TestStatusSchema,
}).pipe(
  Schema.omit("id", "slug", "description", "status", "publishedAt", "createdAt", "updatedAt"),
);

export const UpdateTestMetaInputSchema = Schema.extend(
  Schema.Struct({
    testId: vStr,
  }),
  createInsertSchema(test, {
    id: () => vStr,
    slug: () => vStr,
    title: () => vTitle,
    description: () => vDescriptionNull,
    status: () => TestStatusSchema,
  }).pipe(Schema.omit("id", "slug", "status", "publishedAt", "createdAt", "updatedAt")),
);

export const AddQuestionInputSchema = Schema.extend(
  createInsertSchema(testQuestion, {
    id: () => vStr,
    testId: () => vStr,
    prompt: () => vPrompt,
    description: () => vDescription,
    type: () => Schema.Literal("multiple_choice"),
  }).pipe(
    Schema.omit(
      "id",
      "position",
      "prompt",
      "description",
      "required",
      "type",
      "createdAt",
      "updatedAt",
    ),
  ),
  Schema.Struct({
    afterQuestionId: vStrNullOpt,
  }),
);

export const UpdateQuestionInputSchema = Schema.extend(
  Schema.Struct({
    questionId: vStr,
  }),
  createUpdateSchema(testQuestion, {
    prompt: () => vPrompt,
    description: () => vDescription,
    type: () => Schema.Literal("multiple_choice"),
  }).pipe(Schema.omit("id", "testId", "position", "type", "createdAt", "updatedAt")),
);

export const ReorderQuestionsInputSchema = Schema.Struct({
  testId: vStr,
  questionIds: Schema.Array(vStr),
});

export const AddChoiceInputSchema = Schema.extend(
  createInsertSchema(questionChoice, {
    id: () => vStr,
    questionId: () => vStr,
    label: () => vChoiceLabel,
  }).pipe(Schema.omit("id", "position", "label", "createdAt", "updatedAt")),
  Schema.Struct({
    afterChoiceId: vStrNullOpt,
  }),
);

export const UpdateChoiceInputSchema = Schema.extend(
  Schema.Struct({
    choiceId: vStr,
  }),
  createInsertSchema(questionChoice, {
    id: () => vStr,
    questionId: () => vStr,
    label: () => vChoiceLabel,
  }).pipe(Schema.omit("id", "questionId", "position", "createdAt", "updatedAt")),
);

export const ReorderChoicesInputSchema = Schema.Struct({
  questionId: vStr,
  choiceIds: Schema.Array(vStr),
});

export const DeleteQuestionInputSchema = Schema.Struct({
  questionId: vStr,
});

export const DeleteChoiceInputSchema = Schema.Struct({
  choiceId: vStr,
});

export const AddEditorInputSchema = createInsertSchema(testEmailAccess, {
  id: () => vStr,
  testId: () => vStr,
  email: () => vEmailLower,
  role: () => Schema.String,
  grantedByUserId: () => vStr,
}).pipe(Schema.omit("id", "role", "grantedByUserId", "createdAt", "updatedAt", "lastSentAt"));

export const ShareTestInputSchema = createInsertSchema(testEmailAccess, {
  id: () => vStr,
  testId: () => vStr,
  email: () => vEmailLower,
  role: () => Schema.String,
  grantedByUserId: () => vStr,
}).pipe(Schema.omit("id", "role", "grantedByUserId", "createdAt", "updatedAt", "lastSentAt"));

export const RemoveEditorInputSchema = createInsertSchema(testUser, {
  testId: () => vStr,
  userId: () => vStr,
  role: () => Schema.String,
  grantedByUserId: () => vStr,
}).pipe(Schema.omit("role", "grantedByUserId", "createdAt"));

export const TestIdInputSchema = createInsertSchema(testResponse, {
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

export const ResponseSearchSchema = Schema.Struct({
  page: Schema.Number,
  query: Schema.String,
  status: ResponsesStatusFilterSchema,
  sortBy: ResponsesSortBySchema,
  direction: SortDirectionSchema,
});

export const ResponseDetailInputSchema = Schema.extend(
  TestIdInputSchema,
  Schema.Struct({
    responseId: vStr,
  }),
);

export const SaveAnswerInputSchema = Schema.extend(
  Schema.Struct({
    testId: vStr,
  }),
  createInsertSchema(responseAnswer, {
    id: () => vStr,
    responseId: () => vStr,
    questionId: () => vStr,
    choiceId: () => vStr,
  }).pipe(Schema.omit("id", "responseId", "createdAt", "updatedAt")),
);

export const SubmitResponseInputSchema = createInsertSchema(testResponse, {
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

export const LibrarySearchSchema = Schema.Struct({
  scope: TestScopeSchema,
});

export const TakeTestSearchSchema = Schema.Struct({
  inviteEmail: vStrTrimOpt,
});

export type CreateTestInput = Infer<typeof CreateTestInputSchema>;
export type UpdateTestMetaInput = Infer<typeof UpdateTestMetaInputSchema>;
export type AddQuestionInput = Infer<typeof AddQuestionInputSchema>;
export type UpdateQuestionInput = Infer<typeof UpdateQuestionInputSchema>;
export type ReorderQuestionsInput = Infer<typeof ReorderQuestionsInputSchema>;
export type AddChoiceInput = Infer<typeof AddChoiceInputSchema>;
export type UpdateChoiceInput = Infer<typeof UpdateChoiceInputSchema>;
export type ReorderChoicesInput = Infer<typeof ReorderChoicesInputSchema>;
export type DeleteQuestionInput = Infer<typeof DeleteQuestionInputSchema>;
export type DeleteChoiceInput = Infer<typeof DeleteChoiceInputSchema>;
export type AddEditorInput = Infer<typeof AddEditorInputSchema>;
export type ShareTestInput = Infer<typeof ShareTestInputSchema>;
export type RemoveEditorInput = Infer<typeof RemoveEditorInputSchema>;
export type TestIdInput = Infer<typeof TestIdInputSchema>;
export type ResponseSearchInput = Infer<typeof ResponseSearchSchema>;
export type ResponseDetailInput = Infer<typeof ResponseDetailInputSchema>;
export type SaveAnswerInput = Infer<typeof SaveAnswerInputSchema>;
export type SubmitResponseInput = Infer<typeof SubmitResponseInputSchema>;
export type LibrarySearch = Infer<typeof LibrarySearchSchema>;
export type TakeTestSearch = Infer<typeof TakeTestSearchSchema>;

export const parseResponseSearchInput = makeUnknownParser(
  ResponseSearchSchema,
  (input): ResponseSearchInput => {
    const record = isRecord(input) ? input : {};
    return {
      page: Math.max(1, Math.trunc(asNumber(record.page, 1))),
      query: typeof record.query === "string" ? record.query : "",
      status: oneOf(record.status, ["all", "draft", "submitted"], "all"),
      sortBy: oneOf(record.sortBy, ["startedAt", "submittedAt"], "submittedAt"),
      direction: oneOf(record.direction, ["asc", "desc"], "desc"),
    };
  },
);

export const parseLibrarySearch = makeUnknownParser(LibrarySearchSchema, (input): LibrarySearch => {
  const record = isRecord(input) ? input : {};
  return {
    scope: oneOf(record.scope, ["drafts", "published", "shared"], "drafts"),
  };
});

export const parseTakeTestSearch = makeUnknownParser(
  TakeTestSearchSchema,
  (input): TakeTestSearch => {
    const record = isRecord(input) ? input : {};
    return {
      inviteEmail: asOptionalString(record.inviteEmail),
    };
  },
);

export const testScopeValidator = Schema.standardSchemaV1(TestScopeSchema);
export const createTestInputValidator = Schema.standardSchemaV1(CreateTestInputSchema);
export const updateTestMetaInputValidator = Schema.standardSchemaV1(UpdateTestMetaInputSchema);
export const addQuestionInputValidator = Schema.standardSchemaV1(AddQuestionInputSchema);
export const updateQuestionInputValidator = Schema.standardSchemaV1(UpdateQuestionInputSchema);
export const reorderQuestionsInputValidator = Schema.standardSchemaV1(ReorderQuestionsInputSchema);
export const addChoiceInputValidator = Schema.standardSchemaV1(AddChoiceInputSchema);
export const updateChoiceInputValidator = Schema.standardSchemaV1(UpdateChoiceInputSchema);
export const reorderChoicesInputValidator = Schema.standardSchemaV1(ReorderChoicesInputSchema);
export const deleteQuestionInputValidator = Schema.standardSchemaV1(DeleteQuestionInputSchema);
export const deleteChoiceInputValidator = Schema.standardSchemaV1(DeleteChoiceInputSchema);
export const addEditorInputValidator = Schema.standardSchemaV1(AddEditorInputSchema);
export const shareTestInputValidator = Schema.standardSchemaV1(ShareTestInputSchema);
export const removeEditorInputValidator = Schema.standardSchemaV1(RemoveEditorInputSchema);
export const testIdInputValidator = Schema.standardSchemaV1(TestIdInputSchema);
export const responseDetailInputValidator = Schema.standardSchemaV1(ResponseDetailInputSchema);
export const saveAnswerInputValidator = Schema.standardSchemaV1(SaveAnswerInputSchema);
export const submitResponseInputValidator = Schema.standardSchemaV1(SubmitResponseInputSchema);
