import { Schema } from "effect";

function opt<S extends Schema.Schema.AnyNoContext>(schema: S) {
  return Schema.optional(schema);
}

function nullOpt<S extends Schema.Schema.AnyNoContext>(schema: S) {
  return Schema.optional(Schema.NullOr(schema));
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
