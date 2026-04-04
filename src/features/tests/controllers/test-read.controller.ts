import { Effect } from "effect";
import { createServerFn } from "@tanstack/react-start";
import { TestReadService } from "@/domains/tests/services/test-read.service";
import {
  parseResponseDetailInput,
  parseResponseSearchInput,
  parseTestIdInput,
} from "@/domains/tests/schema";
import { runServerEffect } from "@/server/runtime/run-server-effect";
import { withCurrentUser } from "./shared";

export const getDashboardData = createServerFn({ method: "GET" }).handler(() =>
  runServerEffect(withCurrentUser((userId) => Effect.flatMap(TestReadService, (service) => service.getDashboard(userId)))),
);

export const getTests = createServerFn({ method: "GET" })
  .inputValidator((value) => value as "drafts" | "published" | "shared")
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) => Effect.flatMap(TestReadService, (service) => service.getTestsList(userId, data))),
    ),
  );

export const getTestEditor = createServerFn({ method: "GET" })
  .inputValidator(parseTestIdInput)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) => Effect.flatMap(TestReadService, (service) => service.getEditorView(data.testId, userId))),
    ),
  );

export const getTestTake = createServerFn({ method: "GET" })
  .inputValidator(parseTestIdInput)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) => Effect.flatMap(TestReadService, (service) => service.getTakeView(data.testId, userId))),
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
  .inputValidator(parseResponseDetailInput)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestReadService, (service) => service.getResponseReview(data.testId, data.responseId, userId)),
      ),
    ),
  );

export const getMyResponsesData = createServerFn({ method: "GET" }).handler(() =>
  runServerEffect(
    withCurrentUser((userId) => Effect.flatMap(TestReadService, (service) => service.getMyResponses(userId))),
  ),
);
