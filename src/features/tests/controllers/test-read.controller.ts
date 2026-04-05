import { createServerFn } from "@tanstack/react-start";
import { Effect } from "effect";

import {
  parseResponseSearchInput,
  responseDetailInputValidator,
  testIdInputValidator,
  testScopeValidator,
} from "@/domains/tests/schema";
import { TestReadService } from "@/domains/tests/services/test-read.service";
import { runServerEffect } from "@/server/runtime/run-server-effect";

import { withCurrentUser } from "./shared";

export const getDashboardData = createServerFn({ method: "GET" }).handler(() =>
  runServerEffect(
    withCurrentUser((userId) =>
      Effect.flatMap(TestReadService, (service) => service.getDashboard(userId)),
    ),
  ),
);

export const getTests = createServerFn({ method: "GET" })
  .inputValidator(testScopeValidator)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestReadService, (service) => service.getTestsList(userId, data)),
      ),
    ),
  );

export const getTestEditor = createServerFn({ method: "GET" })
  .inputValidator(testIdInputValidator)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestReadService, (service) => service.getEditorView(data.testId, userId)),
      ),
    ),
  );

export const getTestTake = createServerFn({ method: "GET" })
  .inputValidator(testIdInputValidator)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestReadService, (service) => service.getTakeView(data.testId, userId)),
      ),
    ),
  );

export const getResponsesTableData = createServerFn({ method: "GET" })
  .inputValidator((value) => {
    const parsed = parseResponseSearchInput(value);
    const record = value as { testId?: string };
    return {
      ...parsed,
      testId: typeof record?.testId === "string" ? record.testId : "",
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

export const getResponseDetail = createServerFn({ method: "GET" })
  .inputValidator(responseDetailInputValidator)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestReadService, (service) =>
          service.getResponseReview(data.testId, data.responseId, userId),
        ),
      ),
    ),
  );

export const getMyResponsesData = createServerFn({ method: "GET" }).handler(() =>
  runServerEffect(
    withCurrentUser((userId) =>
      Effect.flatMap(TestReadService, (service) => service.getMyResponses(userId)),
    ),
  ),
);

export type DashboardDto = Awaited<ReturnType<typeof getDashboardData>>;
export type TestsListDto = Awaited<ReturnType<typeof getTests>>;
export type TestSummaryDto = TestsListDto[number];
export type TestEditorDto = Awaited<ReturnType<typeof getTestEditor>>;
export type TestMetaView = TestEditorDto["test"];
export type Collaborator = TestEditorDto["collaborators"][number];
export type TakerInvite = TestEditorDto["takerInvites"][number];
export type QuestionView = TestEditorDto["questions"][number];
export type ChoiceView = QuestionView["choices"][number];
export type TestTakeDto = Awaited<ReturnType<typeof getTestTake>>;
export type TestResponseView = TestTakeDto["response"];
export type ResponsesTableDto = Awaited<ReturnType<typeof getResponsesTableData>>;
export type ResponseTableRow = ResponsesTableDto[number];
export type ResponseDetailDto = Awaited<ReturnType<typeof getResponseDetail>>;
export type MyResponsesDto = Awaited<ReturnType<typeof getMyResponsesData>>;
export type MyResponseDto = MyResponsesDto[number];
