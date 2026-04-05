import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

import { TestReadService } from "@/domains/tests/services/test-read.service";
import { TestResponseTableInputSchema } from "@/schemas/entities";
import { TestScopeSchema, vStr } from "@/schemas/primitives";
import { parseResponseSearchInput, ResponseSearchSchema } from "@/schemas/search";
import { runServerEffect } from "@/server/runtime/run-server-effect";

import { withCurrentUser } from "./shared";

export const getDashboardData = createServerFn({ method: "GET" }).handler(() =>
  runServerEffect(
    withCurrentUser((userId) =>
      Effect.flatMap(TestReadService, (service) => service.getDashboard(userId)),
    ),
  ),
);
export type GetDashboardDataResponse = Awaited<ReturnType<typeof getDashboardData>>;

export const getTestsInput = Schema.standardSchemaV1(TestScopeSchema);
export type GetTestsInput = Schema.Schema.Type<typeof getTestsInput>;
export const getTests = createServerFn({ method: "GET" })
  .inputValidator(getTestsInput)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestReadService, (service) => service.getTestsList(userId, data)),
      ),
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
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestReadService, (service) => service.getEditorView(data.testId, userId)),
      ),
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
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestReadService, (service) => service.getTakeView(data.testId, userId)),
      ),
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
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestReadService, (service) => {
          const { testId, ...search } = data;
          return service.getResponsesTable(testId, userId, search);
        }),
      ),
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
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestReadService, (service) =>
          service.getResponseReview(data.testId, data.responseId, userId),
        ),
      ),
    ),
  );
export type GetResponseDetailResponse = Awaited<ReturnType<typeof getResponseDetail>>;

export const getMyResponsesData = createServerFn({ method: "GET" }).handler(() =>
  runServerEffect(
    withCurrentUser((userId) =>
      Effect.flatMap(TestReadService, (service) => service.getMyResponses(userId)),
    ),
  ),
);
export type GetMyResponsesDataResponse = Awaited<ReturnType<typeof getMyResponsesData>>;
