import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

import { TestReadService } from "@/domains/tests/services/test-read.service";
import { TestResponseTableInputSchema } from "@/schemas/entities";
import { TestScopeSchema, vStr } from "@/schemas/primitives";
import { parseResponseSearchInput, ResponseSearchSchema } from "@/schemas/search";
import { runServerResultEffect } from "@/server/runtime/run-server-result-effect";

import { currentUserIdEffect } from "./shared";

export const getDashboardData = createServerFn({ method: "GET" }).handler(() =>
  runServerResultEffect(
    Effect.gen(function* () {
      const userId = yield* currentUserIdEffect;
      const testReadService = yield* TestReadService;
      return yield* testReadService.getDashboard(userId);
    }),
    { name: "tests.getDashboardData" },
  ),
);
export type GetDashboardDataResponse = Awaited<ReturnType<typeof getDashboardData>>;

export const getTestsInput = Schema.standardSchemaV1(TestScopeSchema);
export type GetTestsInput = Schema.Schema.Type<typeof getTestsInput>;
export const getTests = createServerFn({ method: "GET" })
  .inputValidator(getTestsInput)
  .handler(({ data }) =>
    runServerResultEffect(
      Effect.gen(function* () {
        const userId = yield* currentUserIdEffect;
        const testReadService = yield* TestReadService;
        return yield* testReadService.getTestsList(userId, data);
      }),
      { name: "tests.getTests" },
    ),
  );
export type GetTestsResponse = Awaited<ReturnType<typeof getTests>>;

export const getTestEditorInput = TestResponseTableInputSchema.pipe(
  Schema.pick("testId"),
  Schema.standardSchemaV1,
);
export type GetTestEditorInput = Schema.Schema.Type<typeof getTestEditorInput>;
export const getTestEditor = createServerFn({ method: "GET" })
  .inputValidator(getTestEditorInput)
  .handler(({ data }) =>
    runServerResultEffect(
      Effect.gen(function* () {
        const userId = yield* currentUserIdEffect;
        const testReadService = yield* TestReadService;
        return yield* testReadService.getEditorView(data.testId, userId);
      }),
      { name: "tests.getTestEditor" },
    ),
  );
export type GetTestEditorResponse = Awaited<ReturnType<typeof getTestEditor>>;

export const getTestTakeInput = TestResponseTableInputSchema.pipe(
  Schema.pick("testId"),
  Schema.standardSchemaV1,
);
export type GetTestTakeInput = Schema.Schema.Type<typeof getTestTakeInput>;
export const getTestTake = createServerFn({ method: "GET" })
  .inputValidator(getTestTakeInput)
  .handler(({ data }) =>
    runServerResultEffect(
      Effect.gen(function* () {
        const userId = yield* currentUserIdEffect;
        const testReadService = yield* TestReadService;
        return yield* testReadService.getTakeView(data.testId, userId);
      }),
      { name: "tests.getTestTake" },
    ),
  );
export type GetTestTakeResponse = Awaited<ReturnType<typeof getTestTake>>;

export const getResponsesTableDataInput = Schema.extend(
  Schema.Struct({
    testId: vStr,
  }),
  ResponseSearchSchema,
);
export type GetResponsesTableDataInput = Schema.Schema.Type<typeof getResponsesTableDataInput>;
export const getResponsesTableData = createServerFn({ method: "GET" })
  .inputValidator((value): GetResponsesTableDataInput => {
    const record = value as { testId?: unknown };
    return {
      ...parseResponseSearchInput(value),
      testId: typeof record.testId === "string" ? record.testId : "",
    };
  })
  .handler(({ data }) =>
    runServerResultEffect(
      Effect.gen(function* () {
        const userId = yield* currentUserIdEffect;
        const testReadService = yield* TestReadService;
        const { testId, ...search } = data;
        return yield* testReadService.getResponsesTable(testId, userId, search);
      }),
      { name: "tests.getResponsesTableData" },
    ),
  );
export type GetResponsesTableDataResponse = Awaited<ReturnType<typeof getResponsesTableData>>;

export const getResponseDetailInput = Schema.extend(
  TestResponseTableInputSchema.pipe(Schema.pick("testId")),
  Schema.Struct({
    responseId: vStr,
  }),
).pipe(Schema.standardSchemaV1);
export type GetResponseDetailInput = Schema.Schema.Type<typeof getResponseDetailInput>;
export const getResponseDetail = createServerFn({ method: "GET" })
  .inputValidator(getResponseDetailInput)
  .handler(({ data }) =>
    runServerResultEffect(
      Effect.gen(function* () {
        const userId = yield* currentUserIdEffect;
        const testReadService = yield* TestReadService;
        return yield* testReadService.getResponseReview(data.testId, data.responseId, userId);
      }),
      { name: "tests.getResponseDetail" },
    ),
  );
export type GetResponseDetailResponse = Awaited<ReturnType<typeof getResponseDetail>>;

export const getMyResponsesData = createServerFn({ method: "GET" }).handler(() =>
  runServerResultEffect(
    Effect.gen(function* () {
      const userId = yield* currentUserIdEffect;
      const testReadService = yield* TestReadService;
      return yield* testReadService.getMyResponses(userId);
    }),
    { name: "tests.getMyResponsesData" },
  ),
);
export type GetMyResponsesDataResponse = Awaited<ReturnType<typeof getMyResponsesData>>;
