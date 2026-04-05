import { Schema } from "effect";

const TestStatusSchema = Schema.Literal("draft", "published", "archived");
const QuestionTypeSchema = Schema.Literal("multiple_choice");
const ResponseStatusSchema = Schema.Literal("draft", "submitted");
const TestPermissionSchema = Schema.Literal("owner", "editor", "taker");
const CollaboratorRoleSchema = Schema.Literal("owner", "editor");
const IdSchema = Schema.String;
const EmailSchema = Schema.String;
const NameSchema = Schema.String;
const LabelSchema = Schema.String;
const TitleSchema = Schema.String;
const SlugSchema = Schema.String;
const IsoDateTimeSchema = Schema.String;
const NullableIsoDateTimeSchema = Schema.NullOr(IsoDateTimeSchema);
const mutableArrayOf = <S extends Schema.Schema.AnyNoContext>(schema: S) =>
  Schema.mutable(Schema.Array(schema));

export const ChoiceViewSchema = Schema.Struct({
  id: IdSchema,
  position: Schema.Number,
  label: LabelSchema,
});

export const QuestionViewSchema = Schema.Struct({
  id: IdSchema,
  position: Schema.Number,
  prompt: Schema.String,
  description: Schema.NullOr(Schema.String),
  required: Schema.Boolean,
  type: QuestionTypeSchema,
  choices: mutableArrayOf(ChoiceViewSchema),
});

export const CollaboratorSchema = Schema.Struct({
  id: IdSchema,
  email: EmailSchema,
  name: NameSchema,
  image: Schema.NullOr(Schema.String),
  role: CollaboratorRoleSchema,
  invitedAt: Schema.optional(IsoDateTimeSchema),
});

export const TakerInviteSchema = Schema.Struct({
  id: IdSchema,
  email: EmailSchema,
  invitedAt: IsoDateTimeSchema,
  lastSentAt: IsoDateTimeSchema,
});

export const TestMetaViewSchema = Schema.Struct({
  id: IdSchema,
  slug: SlugSchema,
  title: TitleSchema,
  description: Schema.NullOr(Schema.String),
  status: TestStatusSchema,
  ownerUserId: IdSchema,
  ownerName: NameSchema,
  publishedAt: NullableIsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  createdAt: IsoDateTimeSchema,
});

export const TestSummarySchema = Schema.Struct({
  id: IdSchema,
  slug: SlugSchema,
  title: TitleSchema,
  description: Schema.NullOr(Schema.String),
  status: TestStatusSchema,
  ownerName: NameSchema,
  viewerPermission: TestPermissionSchema,
  updatedAt: IsoDateTimeSchema,
  publishedAt: NullableIsoDateTimeSchema,
  editorCount: Schema.Number,
  responseCount: Schema.Number,
});

export const TestResponseViewSchema = Schema.Struct({
  id: Schema.NullOr(IdSchema),
  status: Schema.NullOr(ResponseStatusSchema),
  startedAt: NullableIsoDateTimeSchema,
  submittedAt: NullableIsoDateTimeSchema,
  lastAutosavedAt: NullableIsoDateTimeSchema,
  answers: Schema.Record({ key: Schema.String, value: Schema.String }),
});

export const TestTakeViewSchema = Schema.Struct({
  test: TestMetaViewSchema,
  questions: mutableArrayOf(QuestionViewSchema),
  response: TestResponseViewSchema,
  viewerPermission: TestPermissionSchema,
  canEdit: Schema.Boolean,
});

export const TestEditorViewSchema = Schema.Struct({
  test: TestMetaViewSchema,
  collaborators: mutableArrayOf(CollaboratorSchema),
  takerInvites: mutableArrayOf(TakerInviteSchema),
  questions: mutableArrayOf(QuestionViewSchema),
  responseCount: Schema.Number,
  viewerPermission: CollaboratorRoleSchema,
});

export const ResponseTableRowSchema = Schema.Struct({
  id: IdSchema,
  responderName: NameSchema,
  responderEmail: EmailSchema,
  status: ResponseStatusSchema,
  startedAt: IsoDateTimeSchema,
  submittedAt: NullableIsoDateTimeSchema,
  lastAutosavedAt: NullableIsoDateTimeSchema,
});

export const ResponseReviewViewSchema = Schema.Struct({
  test: TestMetaViewSchema,
  questions: mutableArrayOf(QuestionViewSchema),
  response: Schema.extend(
    TestResponseViewSchema,
    Schema.Struct({
      id: IdSchema,
      status: ResponseStatusSchema,
    }),
  ),
  responder: Schema.Struct({
    id: IdSchema,
    name: NameSchema,
    email: EmailSchema,
    image: Schema.NullOr(Schema.String),
  }),
  viewerPermission: CollaboratorRoleSchema,
});

export const DashboardRecentResponseSchema = Schema.Struct({
  id: IdSchema,
  testId: IdSchema,
  testTitle: TitleSchema,
  status: ResponseStatusSchema,
  updatedAt: IsoDateTimeSchema,
  submittedAt: NullableIsoDateTimeSchema,
});

export const DashboardViewSchema = Schema.Struct({
  drafts: mutableArrayOf(TestSummarySchema),
  published: mutableArrayOf(TestSummarySchema),
  recentResponses: mutableArrayOf(DashboardRecentResponseSchema),
});

export const CreateTestResultSchema = Schema.Struct({
  id: IdSchema,
});

export const MutationOkSchema = Schema.Struct({
  ok: Schema.Literal(true),
});
