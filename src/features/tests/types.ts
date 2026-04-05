import type { ResponseTableRow } from "@/domains/tests/dto";
import type { GetMyResponsesDataResponse as GetMyResponsesDataControllerResponse } from "@/features/tests/controllers/test-read.controller";

export type {
  ChoiceView as GetTestEditorChoice,
  Collaborator as GetTestEditorCollaborator,
  DashboardView as GetDashboardDataResponse,
  QuestionView as GetTestEditorQuestion,
  ResponseReviewView as GetResponseDetailResponse,
  ResponseTableRow as GetResponsesTableDataItem,
  TakerInvite as GetTestEditorTakerInvite,
  TestEditorView as GetTestEditorResponse,
  TestMetaView as GetTestEditorTest,
  TestResponseView as GetTestTakeResponseData,
  TestSummary as GetTestsItem,
  TestTakeView as GetTestTakeResponse,
} from "@/domains/tests/dto";
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
  GetResponseDetailResponse as GetResponseDetailControllerResponse,
  GetMyResponsesDataResponse as GetMyResponsesDataControllerResponse,
  GetResponsesTableDataResponse as GetResponsesTableDataControllerResponse,
  GetTestEditorResponse as GetTestEditorControllerResponse,
  GetTestsResponse,
  GetTestTakeResponse as GetTestTakeControllerResponse,
} from "@/features/tests/controllers/test-read.controller";
export type {
  SaveAnswerActionResponse,
  SubmitResponseActionResponse,
} from "@/features/tests/controllers/test-taking.controller";
export type * from "@/domains/tests/model";
export type * from "@/domains/tests/dto";

export type GetResponsesTableDataResponse = Array<ResponseTableRow>;
export type GetMyResponsesDataResponse = GetMyResponsesDataControllerResponse;
export type GetMyResponsesDataItem = GetMyResponsesDataControllerResponse[number];
