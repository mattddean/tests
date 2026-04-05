import type {
  GetMyResponsesDataResponse,
  GetResponsesTableDataResponse,
  GetTestEditorResponse,
  GetTestsResponse,
  GetTestTakeResponse,
} from "@/features/tests/controllers/test-read.controller";

export type {
  AddEditorActionResponse,
  CreateTestResponse,
  PublishTestActionResponse,
  RemoveEditorActionResponse,
  ShareTestActionResponse,
  UpdateTestMetaActionResponse,
} from "@/features/tests/controllers/test-admin.controller";
export type {
  AddChoiceActionResponse,
  AddQuestionActionResponse,
  DeleteChoiceActionResponse,
  DeleteQuestionActionResponse,
  ReorderChoicesActionResponse,
  ReorderQuestionsActionResponse,
  UpdateChoiceActionResponse,
  UpdateQuestionActionResponse,
} from "@/features/tests/controllers/test-editor.controller";
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
} from "@/features/tests/controllers/test-read.controller";
export type {
  SaveAnswerActionResponse,
  SubmitResponseActionResponse,
} from "@/features/tests/controllers/test-taking.controller";
export type * from "@/domains/tests/model";

export type GetTestsItem = GetTestsResponse[number];
export type GetTestEditorTest = GetTestEditorResponse["test"];
export type GetTestEditorCollaborator = GetTestEditorResponse["collaborators"][number];
export type GetTestEditorTakerInvite = GetTestEditorResponse["takerInvites"][number];
export type GetTestEditorQuestion = GetTestEditorResponse["questions"][number];
export type GetTestEditorChoice = GetTestEditorQuestion["choices"][number];
export type GetTestTakeResponseData = GetTestTakeResponse["response"];
export type GetResponsesTableDataItem = GetResponsesTableDataResponse[number];
export type GetMyResponsesDataItem = GetMyResponsesDataResponse[number];
