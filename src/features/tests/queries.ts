import { queryOptions } from "@tanstack/react-query";
import {
  getDashboardData,
  getMyResponsesData,
  getResponseDetail,
  getResponsesTableData,
  getTestEditor,
  getTestTake,
  getTests,
} from "./server";

export const testsKeys = {
  all: ["tests"] as const,
  list: (scope: "drafts" | "published" | "shared") => [...testsKeys.all, "list", scope] as const,
  editor: (testId: string) => [...testsKeys.all, "editor", testId] as const,
  take: (testId: string) => [...testsKeys.all, "take", testId] as const,
  responses: (
    testId: string,
    search: {
      page: number;
      query: string;
      status: "all" | "draft" | "submitted";
      sortBy: "startedAt" | "submittedAt";
      direction: "asc" | "desc";
    },
  ) => [...testsKeys.all, "responses", testId, search] as const,
  responseDetail: (testId: string, responseId: string) =>
    [...testsKeys.all, "response-detail", testId, responseId] as const,
  dashboard: () => [...testsKeys.all, "dashboard"] as const,
  myResponses: () => [...testsKeys.all, "my-responses"] as const,
};

export function dashboardQueryOptions() {
  return queryOptions({
    queryKey: testsKeys.dashboard(),
    queryFn: () => getDashboardData(),
  });
}

export function testsListQueryOptions(scope: "drafts" | "published" | "shared") {
  return queryOptions({
    queryKey: testsKeys.list(scope),
    queryFn: () => getTests({ data: scope }),
  });
}

export function testEditorQueryOptions(testId: string) {
  return queryOptions({
    queryKey: testsKeys.editor(testId),
    queryFn: () => getTestEditor({ data: { testId } }),
  });
}

export function testTakeQueryOptions(testId: string) {
  return queryOptions({
    queryKey: testsKeys.take(testId),
    queryFn: () => getTestTake({ data: { testId } }),
  });
}

export function responsesTableQueryOptions(
  testId: string,
  search: {
    page: number;
    query: string;
    status: "all" | "draft" | "submitted";
    sortBy: "startedAt" | "submittedAt";
    direction: "asc" | "desc";
  },
) {
  return queryOptions({
    queryKey: testsKeys.responses(testId, search),
    queryFn: () => getResponsesTableData({ data: { testId, ...search } }),
  });
}

export function responseDetailQueryOptions(testId: string, responseId: string) {
  return queryOptions({
    queryKey: testsKeys.responseDetail(testId, responseId),
    queryFn: () => getResponseDetail({ data: { testId, responseId } }),
  });
}

export function myResponsesQueryOptions() {
  return queryOptions({
    queryKey: testsKeys.myResponses(),
    queryFn: () => getMyResponsesData(),
  });
}
