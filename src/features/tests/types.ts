export type TestStatus = "draft" | "published" | "archived";
export type QuestionType = "multiple_choice";
export type ResponseStatus = "draft" | "submitted";
export type TestPermission = "owner" | "editor" | "taker";

export type Collaborator = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: "owner" | "editor";
  invitedAt?: string;
};

export type TakerInvite = {
  id: string;
  email: string;
  invitedAt: string;
  lastSentAt: string;
  acceptedAt: string | null;
  acceptedByName: string | null;
};

export type ChoiceView = {
  id: string;
  position: number;
  label: string;
};

export type QuestionView = {
  id: string;
  position: number;
  prompt: string;
  description: string | null;
  required: boolean;
  type: QuestionType;
  choices: Array<ChoiceView>;
};

export type TestMetaView = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: TestStatus;
  ownerUserId: string;
  ownerName: string;
  publishedAt: string | null;
  updatedAt: string;
  createdAt: string;
};

export type TestSummary = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: TestStatus;
  ownerName: string;
  viewerPermission: TestPermission;
  updatedAt: string;
  publishedAt: string | null;
  editorCount: number;
  responseCount: number;
};

export type TestEditorView = {
  test: TestMetaView;
  collaborators: Array<Collaborator>;
  takerInvites: Array<TakerInvite>;
  questions: Array<QuestionView>;
  responseCount: number;
  viewerPermission: "owner" | "editor";
};

export type TestResponseView = {
  id: string | null;
  status: ResponseStatus | null;
  startedAt: string | null;
  submittedAt: string | null;
  lastAutosavedAt: string | null;
  answers: Record<string, string>;
};

export type TestTakeView = {
  test: TestMetaView;
  questions: Array<QuestionView>;
  response: TestResponseView;
  viewerPermission: TestPermission;
  canEdit: boolean;
};

export type ResponseTableRow = {
  id: string;
  responderName: string;
  responderEmail: string;
  status: ResponseStatus;
  startedAt: string;
  submittedAt: string | null;
  lastAutosavedAt: string | null;
};

export type ResponseReviewView = {
  test: TestMetaView;
  questions: Array<QuestionView>;
  response: TestResponseView & { id: string; status: ResponseStatus };
  responder: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  viewerPermission: "owner" | "editor";
};

export type DashboardView = {
  drafts: Array<TestSummary>;
  published: Array<TestSummary>;
  recentResponses: Array<{
    id: string;
    testId: string;
    testTitle: string;
    status: ResponseStatus;
    updatedAt: string;
    submittedAt: string | null;
  }>;
};
