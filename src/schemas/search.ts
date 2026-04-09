import { Schema } from "effect";

import {
  ResponsesSortBySchema,
  ResponsesStatusFilterSchema,
  SortDirectionSchema,
  TestScopeSchema,
  vStrTrimOpt,
} from "./primitives";
import { asNumber, asOptionalString, isRecord, makeUnknownParser, oneOf } from "./shared";

type Infer<S extends Schema.Schema.AnyNoContext> = Schema.Schema.Type<S>;

export const ResponseSearchSchema = Schema.Struct({
  page: Schema.Number,
  query: Schema.String,
  status: ResponsesStatusFilterSchema,
  sortBy: ResponsesSortBySchema,
  direction: SortDirectionSchema,
});

export const LibrarySearchSchema = Schema.Struct({
  scope: TestScopeSchema,
});

export const TakeTestSearchSchema = Schema.Struct({
  inviteEmail: vStrTrimOpt,
});

export type ResponseSearchInput = Infer<typeof ResponseSearchSchema>;
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
