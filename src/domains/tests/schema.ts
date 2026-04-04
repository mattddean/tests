import { Schema } from "effect";
import { decodeUnknownSync } from "@/lib/effect-schema";

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

function requireString(value: string, field: string) {
  if (!value.trim()) {
    throw new Error(`${field} is required`);
  }

  return value;
}

function normalizeOptionalString(value: string | null | undefined) {
  return value == null ? null : value.trim();
}

export const testStatusSchema = Schema.Literal("draft", "published", "archived");
export const responseStatusSchema = Schema.Literal("draft", "submitted");
export const testScopeSchema = Schema.Literal("drafts", "published", "shared");
export const responsesStatusFilterSchema = Schema.Literal("all", "draft", "submitted");
export const responsesSortBySchema = Schema.Literal("startedAt", "submittedAt");
export const sortDirectionSchema = Schema.Literal("asc", "desc");

export const createTestInputSchema = Schema.Struct({
  title: Schema.String,
});

export const updateTestMetaInputSchema = Schema.Struct({
  testId: Schema.String,
  title: Schema.String,
  description: Schema.NullOr(Schema.String),
});

export const addQuestionInputSchema = Schema.Struct({
  testId: Schema.String,
  afterQuestionId: Schema.optional(Schema.NullOr(Schema.String)),
});

export const updateQuestionInputSchema = Schema.Struct({
  questionId: Schema.String,
  prompt: Schema.optional(Schema.String),
  description: Schema.optional(Schema.NullOr(Schema.String)),
  required: Schema.optional(Schema.Boolean),
});

export const reorderQuestionsInputSchema = Schema.Struct({
  testId: Schema.String,
  questionIds: Schema.Array(Schema.String),
});

export const addChoiceInputSchema = Schema.Struct({
  questionId: Schema.String,
  afterChoiceId: Schema.optional(Schema.NullOr(Schema.String)),
});

export const updateChoiceInputSchema = Schema.Struct({
  choiceId: Schema.String,
  label: Schema.String,
});

export const reorderChoicesInputSchema = Schema.Struct({
  questionId: Schema.String,
  choiceIds: Schema.Array(Schema.String),
});

export const deleteQuestionInputSchema = Schema.Struct({
  questionId: Schema.String,
});

export const deleteChoiceInputSchema = Schema.Struct({
  choiceId: Schema.String,
});

export const addEditorInputSchema = Schema.Struct({
  testId: Schema.String,
  email: Schema.String,
});

export const shareTestInputSchema = Schema.Struct({
  testId: Schema.String,
  email: Schema.String,
});

export const removeEditorInputSchema = Schema.Struct({
  testId: Schema.String,
  userId: Schema.String,
});

export const testIdInputSchema = Schema.Struct({
  testId: Schema.String,
});

export const responseSearchSchema = Schema.Struct({
  page: Schema.Number,
  query: Schema.String,
  status: responsesStatusFilterSchema,
  sortBy: responsesSortBySchema,
  direction: sortDirectionSchema,
});

export const responseDetailInputSchema = Schema.Struct({
  testId: Schema.String,
  responseId: Schema.String,
});

export const saveAnswerInputSchema = Schema.Struct({
  testId: Schema.String,
  questionId: Schema.String,
  choiceId: Schema.String,
});

export const submitResponseInputSchema = Schema.Struct({
  testId: Schema.String,
});

export const librarySearchSchema = Schema.Struct({
  scope: testScopeSchema,
});

export const takeTestSearchSchema = Schema.Struct({
  inviteEmail: Schema.optional(Schema.String),
});

export const TestStatusSchema = testStatusSchema;
export const ResponseStatusSchema = responseStatusSchema;
export const TestScopeSchema = testScopeSchema;
export const ResponsesStatusFilterSchema = responsesStatusFilterSchema;
export const ResponsesSortBySchema = responsesSortBySchema;
export const SortDirectionSchema = sortDirectionSchema;
export const CreateTestInputSchema = createTestInputSchema;
export const UpdateTestMetaInputSchema = updateTestMetaInputSchema;
export const AddQuestionInputSchema = addQuestionInputSchema;
export const UpdateQuestionInputSchema = updateQuestionInputSchema;
export const ReorderQuestionsInputSchema = reorderQuestionsInputSchema;
export const AddChoiceInputSchema = addChoiceInputSchema;
export const UpdateChoiceInputSchema = updateChoiceInputSchema;
export const ReorderChoicesInputSchema = reorderChoicesInputSchema;
export const DeleteQuestionInputSchema = deleteQuestionInputSchema;
export const DeleteChoiceInputSchema = deleteChoiceInputSchema;
export const AddEditorInputSchema = addEditorInputSchema;
export const ShareTestInputSchema = shareTestInputSchema;
export const RemoveEditorInputSchema = removeEditorInputSchema;
export const TestIdInputSchema = testIdInputSchema;
export const ResponseSearchSchema = responseSearchSchema;
export const ResponseDetailInputSchema = responseDetailInputSchema;
export const SaveAnswerInputSchema = saveAnswerInputSchema;
export const SubmitResponseInputSchema = submitResponseInputSchema;
export const LibrarySearchSchema = librarySearchSchema;
export const TakeTestSearchSchema = takeTestSearchSchema;

export type CreateTestInput = {
  title?: string | null;
};

export type UpdateTestMetaInput = {
  testId: string;
  title: string;
  description: string | null;
};

export type AddQuestionInput = {
  testId: string;
  afterQuestionId?: string | null;
};

export type UpdateQuestionInput = {
  questionId: string;
  prompt?: string;
  description?: string | null;
  required?: boolean;
};

export type ReorderQuestionsInput = {
  testId: string;
  questionIds: Array<string>;
};

export type AddChoiceInput = {
  questionId: string;
  afterChoiceId?: string | null;
};

export type UpdateChoiceInput = {
  choiceId: string;
  label: string;
};

export type ReorderChoicesInput = {
  questionId: string;
  choiceIds: Array<string>;
};

export type DeleteQuestionInput = {
  questionId: string;
};

export type DeleteChoiceInput = {
  choiceId: string;
};

export type AddEditorInput = {
  testId: string;
  email: string;
};

export type ShareTestInput = {
  testId: string;
  email: string;
};

export type RemoveEditorInput = {
  testId: string;
  userId: string;
};

export type TestIdInput = {
  testId: string;
};

export type ResponseDetailInput = {
  testId: string;
  responseId: string;
};

export type SaveAnswerInput = {
  testId: string;
  questionId: string;
  choiceId: string;
};

export type SubmitResponseInput = {
  testId: string;
};

const decodeCreateTestInput = decodeUnknownSync(createTestInputSchema);
const decodeUpdateTestMetaInput = decodeUnknownSync(updateTestMetaInputSchema);
const decodeAddQuestionInput = decodeUnknownSync(addQuestionInputSchema);
const decodeUpdateQuestionInput = decodeUnknownSync(updateQuestionInputSchema);
const decodeReorderQuestionsInput = decodeUnknownSync(reorderQuestionsInputSchema);
const decodeAddChoiceInput = decodeUnknownSync(addChoiceInputSchema);
const decodeUpdateChoiceInput = decodeUnknownSync(updateChoiceInputSchema);
const decodeReorderChoicesInput = decodeUnknownSync(reorderChoicesInputSchema);
const decodeDeleteQuestionInput = decodeUnknownSync(deleteQuestionInputSchema);
const decodeDeleteChoiceInput = decodeUnknownSync(deleteChoiceInputSchema);
const decodeAddEditorInput = decodeUnknownSync(addEditorInputSchema);
const decodeShareTestInput = decodeUnknownSync(shareTestInputSchema);
const decodeRemoveEditorInput = decodeUnknownSync(removeEditorInputSchema);
const decodeTestIdInput = decodeUnknownSync(testIdInputSchema);
const decodeResponseSearch = decodeUnknownSync(responseSearchSchema);
const decodeResponseDetailInput = decodeUnknownSync(responseDetailInputSchema);
const decodeSaveAnswerInput = decodeUnknownSync(saveAnswerInputSchema);
const decodeSubmitResponseInput = decodeUnknownSync(submitResponseInputSchema);
const decodeLibrarySearch = decodeUnknownSync(librarySearchSchema);
const decodeTakeTestSearch = decodeUnknownSync(takeTestSearchSchema);

export const parseCreateTestInput = (input: CreateTestInput) =>
  decodeCreateTestInput({
    title: (typeof input.title === "string" ? input.title : "Untitled test").trim() || "Untitled test",
  });

export const parseUpdateTestMetaInput = (input: UpdateTestMetaInput) =>
  decodeUpdateTestMetaInput({
    testId: requireString(input.testId, "testId"),
    title: requireString(input.title, "title").trim(),
    description: normalizeOptionalString(input.description),
  });

export const parseAddQuestionInput = (input: AddQuestionInput) =>
  decodeAddQuestionInput({
    testId: requireString(input.testId, "testId"),
    afterQuestionId: input.afterQuestionId == null ? null : input.afterQuestionId,
  });

export const parseUpdateQuestionInput = (input: UpdateQuestionInput) =>
  decodeUpdateQuestionInput({
    questionId: requireString(input.questionId, "questionId"),
    prompt: typeof input.prompt === "string" ? input.prompt.trim() : undefined,
    description:
      input.description === undefined ? undefined : input.description == null ? null : input.description.trim(),
    required: input.required,
  });

export const parseReorderQuestionsInput = (input: ReorderQuestionsInput) =>
  decodeReorderQuestionsInput({
    testId: requireString(input.testId, "testId"),
    questionIds: input.questionIds,
  });

export const parseAddChoiceInput = (input: AddChoiceInput) =>
  decodeAddChoiceInput({
    questionId: requireString(input.questionId, "questionId"),
    afterChoiceId: input.afterChoiceId == null ? null : input.afterChoiceId,
  });

export const parseUpdateChoiceInput = (input: UpdateChoiceInput) =>
  decodeUpdateChoiceInput({
    choiceId: requireString(input.choiceId, "choiceId"),
    label: requireString(input.label, "label").trim(),
  });

export const parseReorderChoicesInput = (input: ReorderChoicesInput) =>
  decodeReorderChoicesInput({
    questionId: requireString(input.questionId, "questionId"),
    choiceIds: input.choiceIds,
  });

export const parseDeleteQuestionInput = (input: DeleteQuestionInput) =>
  decodeDeleteQuestionInput({
    questionId: requireString(input.questionId, "questionId"),
  });

export const parseDeleteChoiceInput = (input: DeleteChoiceInput) =>
  decodeDeleteChoiceInput({
    choiceId: requireString(input.choiceId, "choiceId"),
  });

export const parseAddEditorInput = (input: AddEditorInput) =>
  decodeAddEditorInput({
    testId: requireString(input.testId, "testId"),
    email: requireString(input.email, "email").trim().toLowerCase(),
  });

export const parseShareTestInput = (input: ShareTestInput) =>
  decodeShareTestInput({
    testId: requireString(input.testId, "testId"),
    email: requireString(input.email, "email").trim().toLowerCase(),
  });

export const parseRemoveEditorInput = (input: RemoveEditorInput) =>
  decodeRemoveEditorInput({
    testId: requireString(input.testId, "testId"),
    userId: requireString(input.userId, "userId"),
  });

export const parseTestIdInput = (input: TestIdInput) =>
  decodeTestIdInput({
    testId: requireString(input.testId, "testId"),
  });

export const parseResponseDetailInput = (input: ResponseDetailInput) =>
  decodeResponseDetailInput({
    testId: requireString(input.testId, "testId"),
    responseId: requireString(input.responseId, "responseId"),
  });

export const parseSaveAnswerInput = (input: SaveAnswerInput) =>
  decodeSaveAnswerInput({
    testId: requireString(input.testId, "testId"),
    questionId: requireString(input.questionId, "questionId"),
    choiceId: requireString(input.choiceId, "choiceId"),
  });

export const parseSubmitResponseInput = (input: SubmitResponseInput) =>
  decodeSubmitResponseInput({
    testId: requireString(input.testId, "testId"),
  });

export const parseResponseSearchInput = (input: unknown) => {
  const record = isRecord(input) ? input : {};
  return decodeResponseSearch({
    page: Math.max(1, Math.trunc(asNumber(record.page, 1))),
    query: typeof record.query === "string" ? record.query : "",
    status: oneOf(record.status, ["all", "draft", "submitted"], "all"),
    sortBy: oneOf(record.sortBy, ["startedAt", "submittedAt"], "submittedAt"),
    direction: oneOf(record.direction, ["asc", "desc"], "desc"),
  });
};

export const parseLibrarySearch = (input: unknown) => {
  const record = isRecord(input) ? input : {};
  return decodeLibrarySearch({
    scope: oneOf(record.scope, ["drafts", "published", "shared"], "drafts"),
  });
};

export const parseTakeTestSearch = (input: unknown) => {
  const record = isRecord(input) ? input : {};
  return decodeTakeTestSearch({
    inviteEmail: asOptionalString(record.inviteEmail),
  });
};
