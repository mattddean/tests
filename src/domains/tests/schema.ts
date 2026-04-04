import { Schema } from "effect";
import { decodeUnknownSync } from "@/lib/effect-schema";

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

function makeTypedDecoder<S extends Schema.Schema.AnyNoContext>(schema: S) {
  const decode = decodeUnknownSync(schema);
  return (input: Infer<S>): Infer<S> => decode(input);
}

function makeUnknownParser<S extends Schema.Schema.AnyNoContext>(
  schema: S,
  normalize: (input: unknown) => Infer<S>,
) {
  const decode = decodeUnknownSync(schema);
  return (input: unknown): Infer<S> => decode(normalize(input));
}

export const testStatusSchema = Schema.Literal("draft", "published", "archived");
export const responseStatusSchema = Schema.Literal("draft", "submitted");
export const testScopeSchema = Schema.Literal("drafts", "published", "shared");
export const responsesStatusFilterSchema = Schema.Literal("all", "draft", "submitted");
export const responsesSortBySchema = Schema.Literal("startedAt", "submittedAt");
export const sortDirectionSchema = Schema.Literal("asc", "desc");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const vStrTrim = Schema.String.pipe(Schema.compose(Schema.Trim));
export const vStr = Schema.String.pipe(
  Schema.compose(Schema.Trim),
  Schema.nonEmptyString(),
);
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
export const vDescription = Schema.String.pipe(
  Schema.compose(Schema.Trim),
  Schema.maxLength(2000),
);
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

export const createTestInputSchema = Schema.Struct({
  title: vTitle,
});

export const updateTestMetaInputSchema = Schema.Struct({
  testId: vStr,
  title: vTitle,
  description: vDescriptionNull,
});

export const addQuestionInputSchema = Schema.Struct({
  testId: vStr,
  afterQuestionId: vStrNullOpt,
});

export const updateQuestionInputSchema = Schema.Struct({
  questionId: vStr,
  prompt: vPromptOpt,
  description: vDescriptionNullOpt,
  required: vBooleanOpt,
});

export const reorderQuestionsInputSchema = Schema.Struct({
  testId: vStr,
  questionIds: Schema.Array(vStr),
});

export const addChoiceInputSchema = Schema.Struct({
  questionId: vStr,
  afterChoiceId: vStrNullOpt,
});

export const updateChoiceInputSchema = Schema.Struct({
  choiceId: vStr,
  label: vChoiceLabel,
});

export const reorderChoicesInputSchema = Schema.Struct({
  questionId: vStr,
  choiceIds: Schema.Array(vStr),
});

export const deleteQuestionInputSchema = Schema.Struct({
  questionId: vStr,
});

export const deleteChoiceInputSchema = Schema.Struct({
  choiceId: vStr,
});

export const addEditorInputSchema = Schema.Struct({
  testId: vStr,
  email: vEmailLower,
});

export const shareTestInputSchema = Schema.Struct({
  testId: vStr,
  email: vEmailLower,
});

export const removeEditorInputSchema = Schema.Struct({
  testId: vStr,
  userId: vStr,
});

export const testIdInputSchema = Schema.Struct({
  testId: vStr,
});

export const responseSearchSchema = Schema.Struct({
  page: Schema.Number,
  query: Schema.String,
  status: responsesStatusFilterSchema,
  sortBy: responsesSortBySchema,
  direction: sortDirectionSchema,
});

export const responseDetailInputSchema = Schema.Struct({
  testId: vStr,
  responseId: vStr,
});

export const saveAnswerInputSchema = Schema.Struct({
  testId: vStr,
  questionId: vStr,
  choiceId: vStr,
});

export const submitResponseInputSchema = Schema.Struct({
  testId: vStr,
});

export const librarySearchSchema = Schema.Struct({
  scope: testScopeSchema,
});

export const takeTestSearchSchema = Schema.Struct({
  inviteEmail: vStrTrimOpt,
});

export type CreateTestInput = Infer<typeof createTestInputSchema>;
export type UpdateTestMetaInput = Infer<typeof updateTestMetaInputSchema>;
export type AddQuestionInput = Infer<typeof addQuestionInputSchema>;
export type UpdateQuestionInput = Infer<typeof updateQuestionInputSchema>;
export type ReorderQuestionsInput = Infer<typeof reorderQuestionsInputSchema>;
export type AddChoiceInput = Infer<typeof addChoiceInputSchema>;
export type UpdateChoiceInput = Infer<typeof updateChoiceInputSchema>;
export type ReorderChoicesInput = Infer<typeof reorderChoicesInputSchema>;
export type DeleteQuestionInput = Infer<typeof deleteQuestionInputSchema>;
export type DeleteChoiceInput = Infer<typeof deleteChoiceInputSchema>;
export type AddEditorInput = Infer<typeof addEditorInputSchema>;
export type ShareTestInput = Infer<typeof shareTestInputSchema>;
export type RemoveEditorInput = Infer<typeof removeEditorInputSchema>;
export type TestIdInput = Infer<typeof testIdInputSchema>;
export type ResponseSearchInput = Infer<typeof responseSearchSchema>;
export type ResponseDetailInput = Infer<typeof responseDetailInputSchema>;
export type SaveAnswerInput = Infer<typeof saveAnswerInputSchema>;
export type SubmitResponseInput = Infer<typeof submitResponseInputSchema>;
export type LibrarySearch = Infer<typeof librarySearchSchema>;
export type TakeTestSearch = Infer<typeof takeTestSearchSchema>;

export const parseCreateTestInput = makeTypedDecoder(createTestInputSchema);
export const parseUpdateTestMetaInput = makeTypedDecoder(updateTestMetaInputSchema);
export const parseAddQuestionInput = makeTypedDecoder(addQuestionInputSchema);
export const parseUpdateQuestionInput = makeTypedDecoder(updateQuestionInputSchema);
export const parseReorderQuestionsInput = makeTypedDecoder(reorderQuestionsInputSchema);
export const parseAddChoiceInput = makeTypedDecoder(addChoiceInputSchema);
export const parseUpdateChoiceInput = makeTypedDecoder(updateChoiceInputSchema);
export const parseReorderChoicesInput = makeTypedDecoder(reorderChoicesInputSchema);
export const parseDeleteQuestionInput = makeTypedDecoder(deleteQuestionInputSchema);
export const parseDeleteChoiceInput = makeTypedDecoder(deleteChoiceInputSchema);
export const parseAddEditorInput = makeTypedDecoder(addEditorInputSchema);
export const parseShareTestInput = makeTypedDecoder(shareTestInputSchema);
export const parseRemoveEditorInput = makeTypedDecoder(removeEditorInputSchema);
export const parseTestIdInput = makeTypedDecoder(testIdInputSchema);
export const parseResponseDetailInput = makeTypedDecoder(responseDetailInputSchema);
export const parseSaveAnswerInput = makeTypedDecoder(saveAnswerInputSchema);
export const parseSubmitResponseInput = makeTypedDecoder(submitResponseInputSchema);

export const parseResponseSearchInput = makeUnknownParser(
  responseSearchSchema,
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

export const parseLibrarySearch = makeUnknownParser(
  librarySearchSchema,
  (input): LibrarySearch => {
    const record = isRecord(input) ? input : {};
    return {
      scope: oneOf(record.scope, ["drafts", "published", "shared"], "drafts"),
    };
  },
);

export const parseTakeTestSearch = makeUnknownParser(
  takeTestSearchSchema,
  (input): TakeTestSearch => {
    const record = isRecord(input) ? input : {};
    return {
      inviteEmail: asOptionalString(record.inviteEmail),
    };
  },
);

export const testScopeValidator = Schema.standardSchemaV1(testScopeSchema);
export const createTestInputValidator = Schema.standardSchemaV1(createTestInputSchema);
export const updateTestMetaInputValidator = Schema.standardSchemaV1(updateTestMetaInputSchema);
export const addQuestionInputValidator = Schema.standardSchemaV1(addQuestionInputSchema);
export const updateQuestionInputValidator = Schema.standardSchemaV1(updateQuestionInputSchema);
export const reorderQuestionsInputValidator = Schema.standardSchemaV1(reorderQuestionsInputSchema);
export const addChoiceInputValidator = Schema.standardSchemaV1(addChoiceInputSchema);
export const updateChoiceInputValidator = Schema.standardSchemaV1(updateChoiceInputSchema);
export const reorderChoicesInputValidator = Schema.standardSchemaV1(reorderChoicesInputSchema);
export const deleteQuestionInputValidator = Schema.standardSchemaV1(deleteQuestionInputSchema);
export const deleteChoiceInputValidator = Schema.standardSchemaV1(deleteChoiceInputSchema);
export const addEditorInputValidator = Schema.standardSchemaV1(addEditorInputSchema);
export const shareTestInputValidator = Schema.standardSchemaV1(shareTestInputSchema);
export const removeEditorInputValidator = Schema.standardSchemaV1(removeEditorInputSchema);
export const testIdInputValidator = Schema.standardSchemaV1(testIdInputSchema);
export const responseDetailInputValidator = Schema.standardSchemaV1(responseDetailInputSchema);
export const saveAnswerInputValidator = Schema.standardSchemaV1(saveAnswerInputSchema);
export const submitResponseInputValidator = Schema.standardSchemaV1(submitResponseInputSchema);

export {
  testStatusSchema as TestStatusSchema,
  responseStatusSchema as ResponseStatusSchema,
  testScopeSchema as TestScopeSchema,
  responsesStatusFilterSchema as ResponsesStatusFilterSchema,
  responsesSortBySchema as ResponsesSortBySchema,
  sortDirectionSchema as SortDirectionSchema,
  createTestInputSchema as CreateTestInputSchema,
  updateTestMetaInputSchema as UpdateTestMetaInputSchema,
  addQuestionInputSchema as AddQuestionInputSchema,
  updateQuestionInputSchema as UpdateQuestionInputSchema,
  reorderQuestionsInputSchema as ReorderQuestionsInputSchema,
  addChoiceInputSchema as AddChoiceInputSchema,
  updateChoiceInputSchema as UpdateChoiceInputSchema,
  reorderChoicesInputSchema as ReorderChoicesInputSchema,
  deleteQuestionInputSchema as DeleteQuestionInputSchema,
  deleteChoiceInputSchema as DeleteChoiceInputSchema,
  addEditorInputSchema as AddEditorInputSchema,
  shareTestInputSchema as ShareTestInputSchema,
  removeEditorInputSchema as RemoveEditorInputSchema,
  testIdInputSchema as TestIdInputSchema,
  responseSearchSchema as ResponseSearchSchema,
  responseDetailInputSchema as ResponseDetailInputSchema,
  saveAnswerInputSchema as SaveAnswerInputSchema,
  submitResponseInputSchema as SubmitResponseInputSchema,
  librarySearchSchema as LibrarySearchSchema,
  takeTestSearchSchema as TakeTestSearchSchema,
};
