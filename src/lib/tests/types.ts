import type {
  myResponsesQueryOptions,
  responsesTableQueryOptions,
  testEditorQueryOptions,
  testTakeQueryOptions,
  testsListQueryOptions,
} from "@/lib/tests/queries";

export type {
  AddEditorActionResponse,
  CreateTestResponse,
  PublishTestActionResponse,
  RemoveEditorActionResponse,
  ShareTestActionResponse,
  UpdateTestMetaActionResponse,
} from "@/controllers/test-admin.controller";
export type {
  AddChoiceActionResponse,
  AddQuestionActionResponse,
  DeleteChoiceActionResponse,
  DeleteQuestionActionResponse,
  ReorderChoicesActionResponse,
  ReorderQuestionsActionResponse,
  UpdateChoiceActionResponse,
  UpdateQuestionActionResponse,
} from "@/controllers/test-editor.controller";
export type {
  GetDashboardDataResponse,
  GetMyResponsesDataResponse,
  GetResponseDetailResponse as GetResponseDetailControllerResponse,
  GetResponsesTableDataResponse as GetResponsesTableDataControllerResponse,
  GetTestEditorResponse as GetTestEditorControllerResponse,
  GetTestEditorResponse,
  GetTestsResponse,
  GetTestTakeResponse,
  GetTestTakeResponse as GetTestTakeControllerResponse,
} from "@/controllers/test-read.controller";
export type {
  SaveAnswerActionResponse,
  SubmitResponseActionResponse,
} from "@/controllers/test-taking.controller";
export type * from "@/lib/tests/model";

type QueryFnData<T extends { queryFn?: (...args: Array<any>) => any }> = Awaited<
  ReturnType<NonNullable<T["queryFn"]>>
>;

type TestsListData = QueryFnData<ReturnType<typeof testsListQueryOptions>>;
type TestEditorData = QueryFnData<ReturnType<typeof testEditorQueryOptions>>;
type TestTakeData = QueryFnData<ReturnType<typeof testTakeQueryOptions>>;
type ResponsesTableData = QueryFnData<ReturnType<typeof responsesTableQueryOptions>>;
type MyResponsesData = QueryFnData<ReturnType<typeof myResponsesQueryOptions>>;

export type GetTestsItem = TestsListData[number];
export type GetTestEditorTest = TestEditorData["test"];
export type GetTestEditorCollaborator = TestEditorData["collaborators"][number];
export type GetTestEditorTakerInvite = TestEditorData["takerInvites"][number];
export type GetTestEditorQuestion = TestEditorData["questions"][number];
export type GetTestEditorChoice = GetTestEditorQuestion["choices"][number];
export type GetTestTakeResponseData = TestTakeData["response"];
export type GetResponsesTableDataItem = ResponsesTableData[number];
export type GetMyResponsesDataItem = MyResponsesData[number];
