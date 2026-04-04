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

export const CreateTestInputSchema = Schema.Struct({
  title: vTitle,
});

export const UpdateTestMetaInputSchema = Schema.Struct({
  testId: vStr,
  title: vTitle,
  description: vDescriptionNull,
});

export const AddQuestionInputSchema = Schema.Struct({
  testId: vStr,
  afterQuestionId: vStrNullOpt,
});

export const UpdateQuestionInputSchema = Schema.Struct({
  questionId: vStr,
  prompt: vPromptOpt,
  description: vDescriptionNullOpt,
  required: vBooleanOpt,
});

export const ReorderQuestionsInputSchema = Schema.Struct({
  testId: vStr,
  questionIds: Schema.Array(vStr),
});

export const AddChoiceInputSchema = Schema.Struct({
  questionId: vStr,
  afterChoiceId: vStrNullOpt,
});

export const UpdateChoiceInputSchema = Schema.Struct({
  choiceId: vStr,
  label: vChoiceLabel,
});

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

export const AddEditorInputSchema = Schema.Struct({
  testId: vStr,
  email: vEmailLower,
});

export const ShareTestInputSchema = Schema.Struct({
  testId: vStr,
  email: vEmailLower,
});

export const RemoveEditorInputSchema = Schema.Struct({
  testId: vStr,
  userId: vStr,
});

export const TestIdInputSchema = Schema.Struct({
  testId: vStr,
});

export const ResponseSearchSchema = Schema.Struct({
  page: Schema.Number,
  query: Schema.String,
  status: ResponsesStatusFilterSchema,
  sortBy: ResponsesSortBySchema,
  direction: SortDirectionSchema,
});

export const ResponseDetailInputSchema = Schema.Struct({
  testId: vStr,
  responseId: vStr,
});

export const SaveAnswerInputSchema = Schema.Struct({
  testId: vStr,
  questionId: vStr,
  choiceId: vStr,
});

export const SubmitResponseInputSchema = Schema.Struct({
  testId: vStr,
});

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

export const parseCreateTestInput = makeTypedDecoder(CreateTestInputSchema);
export const parseUpdateTestMetaInput = makeTypedDecoder(UpdateTestMetaInputSchema);
export const parseAddQuestionInput = makeTypedDecoder(AddQuestionInputSchema);
export const parseUpdateQuestionInput = makeTypedDecoder(UpdateQuestionInputSchema);
export const parseReorderQuestionsInput = makeTypedDecoder(ReorderQuestionsInputSchema);
export const parseAddChoiceInput = makeTypedDecoder(AddChoiceInputSchema);
export const parseUpdateChoiceInput = makeTypedDecoder(UpdateChoiceInputSchema);
export const parseReorderChoicesInput = makeTypedDecoder(ReorderChoicesInputSchema);
export const parseDeleteQuestionInput = makeTypedDecoder(DeleteQuestionInputSchema);
export const parseDeleteChoiceInput = makeTypedDecoder(DeleteChoiceInputSchema);
export const parseAddEditorInput = makeTypedDecoder(AddEditorInputSchema);
export const parseShareTestInput = makeTypedDecoder(ShareTestInputSchema);
export const parseRemoveEditorInput = makeTypedDecoder(RemoveEditorInputSchema);
export const parseTestIdInput = makeTypedDecoder(TestIdInputSchema);
export const parseResponseDetailInput = makeTypedDecoder(ResponseDetailInputSchema);
export const parseSaveAnswerInput = makeTypedDecoder(SaveAnswerInputSchema);
export const parseSubmitResponseInput = makeTypedDecoder(SubmitResponseInputSchema);

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
