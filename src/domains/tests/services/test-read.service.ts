import { and, asc, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { DB } from "@/server/db/live";
import type { Database } from "@/server/db/live";
import { questionChoice, responseAnswer, test, testEmailAccess, testQuestion, testResponse, testUser, user } from "@/server/db/schema";
import type {
  Collaborator,
  DashboardView,
  QuestionView,
  ResponseTableRow,
  ResponseReviewView,
  TakerInvite,
  TestEditorView,
  TestSummary,
  TestTakeView,
} from "../dto";
import { ForbiddenTestAccess, ResponseNotFound, TestNotFound, UserNotFound } from "../errors";
import type { TestPermission } from "../model";

type TestsDb = Omit<Database, "$client">;

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function requirePresent<T>(value: T | undefined | null, error: Error) {
  return value == null ? Effect.fail(error) : Effect.succeed(value);
}

function getTestPermission(db: TestsDb, testId: string, userId: string) {
  return db
    .select()
    .from(testUser)
    .where(and(eq(testUser.testId, testId), eq(testUser.userId, userId)))
    .limit(1)
    .pipe(Effect.map(([membership]) => (membership?.role as TestPermission | undefined) ?? null));
}

function requireEditAccess(db: TestsDb, testId: string, userId: string) {
  return Effect.gen(function* () {
    const permission = yield* getTestPermission(db, testId, userId);
    if (permission !== "owner" && permission !== "editor") {
      return yield* Effect.fail(new ForbiddenTestAccess({ message: "Forbidden" }));
    }
    return permission;
  });
}

function getCurrentUserRecord(db: TestsDb, userId: string) {
  return Effect.gen(function* () {
    const [currentUser] = yield* db.select().from(user).where(eq(user.id, userId)).limit(1);
    return yield* requirePresent(currentUser, new UserNotFound({ message: "User not found" }));
  });
}

function getCurrentTestRecord(db: TestsDb, testId: string) {
  return Effect.gen(function* () {
    const [currentTest] = yield* db.select().from(test).where(eq(test.id, testId)).limit(1);
    return yield* requirePresent(currentTest, new TestNotFound({ message: "Test not found" }));
  });
}

function getOwnerProfile(db: TestsDb, testId: string) {
  return db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    })
    .from(testUser)
    .innerJoin(user, eq(testUser.userId, user.id))
    .where(and(eq(testUser.testId, testId), eq(testUser.role, "owner")))
    .limit(1)
    .pipe(Effect.map((rows) => rows[0] ?? null));
}

function getQuestions(db: TestsDb, testId: string) {
  return Effect.gen(function* () {
    const questions = yield* db.select().from(testQuestion).where(eq(testQuestion.testId, testId)).orderBy(asc(testQuestion.position));
    const questionIds = questions.map((item) => item.id);
    const choices =
      questionIds.length > 0
        ? yield* db.select().from(questionChoice).where(inArray(questionChoice.questionId, questionIds)).orderBy(asc(questionChoice.position))
        : [];

    return questions.map((item) => ({
      id: item.id,
      position: item.position,
      prompt: item.prompt,
      description: item.description,
      required: item.required,
      type: item.type as "multiple_choice",
      choices: choices
        .filter((choice) => choice.questionId === item.id)
        .map((choice) => ({
          id: choice.id,
          position: choice.position,
          label: choice.label,
        })),
    })) satisfies Array<QuestionView>;
  });
}

function getCollaborators(db: TestsDb, testId: string) {
  return db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: testUser.role,
      createdAt: testUser.createdAt,
    })
    .from(testUser)
    .innerJoin(user, eq(testUser.userId, user.id))
    .where(
      and(
        eq(testUser.testId, testId),
        or(eq(testUser.role, "owner"), eq(testUser.role, "editor")),
      ),
    )
    .orderBy(asc(testUser.role), asc(user.name))
    .pipe(
      Effect.map(
        (membershipRows) =>
          membershipRows.map((member) => ({
            id: member.id,
            email: member.email,
            name: member.name,
            image: member.image ?? null,
            role: member.role as "owner" | "editor",
            invitedAt: member.role === "editor" ? member.createdAt.toISOString() : undefined,
          })) satisfies Array<Collaborator>,
      ),
    );
}

function getTakerInvites(db: TestsDb, testId: string) {
  return db
    .select({
      id: testEmailAccess.id,
      email: testEmailAccess.email,
      createdAt: testEmailAccess.createdAt,
      lastSentAt: testEmailAccess.lastSentAt,
    })
    .from(testEmailAccess)
    .where(and(eq(testEmailAccess.testId, testId), eq(testEmailAccess.role, "taker")))
    .orderBy(desc(testEmailAccess.lastSentAt), asc(testEmailAccess.email))
    .pipe(
      Effect.map(
        (inviteRows) =>
          inviteRows.map<TakerInvite>((invite) => ({
            id: invite.id,
            email: invite.email,
            invitedAt: invite.createdAt.toISOString(),
            lastSentAt: invite.lastSentAt.toISOString(),
          })),
      ),
    );
}

function getResponseCount(db: TestsDb, testId: string) {
  return db
    .select({ value: count(testResponse.id) })
    .from(testResponse)
    .where(eq(testResponse.testId, testId))
    .pipe(Effect.map(([result]) => result?.value ?? 0));
}

function toTestSummary(currentTest: {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: string;
  updatedAt: Date;
  publishedAt: Date | null;
  ownerName: string;
  viewerPermission: TestPermission;
  editorCount: number;
  responseCount: number;
}) {
  return {
    id: currentTest.id,
    slug: currentTest.slug,
    title: currentTest.title,
    description: currentTest.description,
    status: currentTest.status as TestSummary["status"],
    ownerName: currentTest.ownerName,
    viewerPermission: currentTest.viewerPermission,
    updatedAt: currentTest.updatedAt.toISOString(),
    publishedAt: toIso(currentTest.publishedAt),
    editorCount: currentTest.editorCount,
    responseCount: currentTest.responseCount,
  } satisfies TestSummary;
}

function toTestMetaView(
  currentTest: typeof test.$inferSelect,
  owner: { id: string; name: string | null } | null,
): TestEditorView["test"] {
  return {
    id: currentTest.id,
    slug: currentTest.slug,
    title: currentTest.title,
    description: currentTest.description,
    status: currentTest.status as TestEditorView["test"]["status"],
    ownerUserId: owner?.id ?? "",
    ownerName: owner?.name ?? "Unknown owner",
    publishedAt: toIso(currentTest.publishedAt),
    updatedAt: currentTest.updatedAt.toISOString(),
    createdAt: currentTest.createdAt.toISOString(),
  };
}

function getResponsesTableRows(
  db: TestsDb,
  testId: string,
  search: {
    page: number;
    query: string;
    status: "all" | "draft" | "submitted";
    sortBy: "startedAt" | "submittedAt";
    direction: "asc" | "desc";
  },
) {
  return Effect.gen(function* () {
    const sortColumn = search.sortBy === "startedAt" ? testResponse.startedAt : testResponse.submittedAt;
    const order = search.direction === "asc" ? asc(sortColumn) : desc(sortColumn);
    const conditions = [
      eq(testResponse.testId, testId),
      search.status === "all" ? undefined : eq(testResponse.status, search.status),
      search.query ? or(ilike(user.name, `%${search.query}%`), ilike(user.email, `%${search.query}%`)) : undefined,
    ].filter(Boolean);

    const rows = yield* db
      .select({
        id: testResponse.id,
        responderName: user.name,
        responderEmail: user.email,
        status: testResponse.status,
        startedAt: testResponse.startedAt,
        submittedAt: testResponse.submittedAt,
        lastAutosavedAt: testResponse.lastAutosavedAt,
      })
      .from(testResponse)
      .innerJoin(user, eq(testResponse.userId, user.id))
      .where(and(...conditions))
      .orderBy(order);

    return rows.map((row) => ({
      id: row.id,
      responderName: row.responderName,
      responderEmail: row.responderEmail,
      status: row.status as "draft" | "submitted",
      startedAt: row.startedAt.toISOString(),
      submittedAt: toIso(row.submittedAt),
      lastAutosavedAt: toIso(row.lastAutosavedAt),
    })) satisfies Array<ResponseTableRow>;
  });
}

export type TestReadServiceShape = {
  readonly getDashboard: (userId: string) => Effect.Effect<DashboardView, unknown>;
  readonly getTestsList: (userId: string, scope: "drafts" | "published" | "shared") => Effect.Effect<Array<TestSummary>, unknown>;
  readonly getEditorView: (testId: string, userId: string) => Effect.Effect<TestEditorView, unknown>;
  readonly getTakeView: (testId: string, userId: string) => Effect.Effect<TestTakeView, unknown>;
  readonly getMyResponses: (userId: string) => Effect.Effect<DashboardView["recentResponses"], unknown>;
  readonly getResponsesTable: (
    testId: string,
    userId: string,
    search: {
      page: number;
      query: string;
      status: "all" | "draft" | "submitted";
      sortBy: "startedAt" | "submittedAt";
      direction: "asc" | "desc";
    },
  ) => Effect.Effect<Array<ResponseTableRow>, unknown>;
  readonly getResponseReview: (testId: string, responseId: string, userId: string) => Effect.Effect<ResponseReviewView, unknown>;
};

export class TestReadService extends Context.Tag("TestReadService")<TestReadService, TestReadServiceShape>() {}

export const TestReadServiceLive = Layer.effect(
  TestReadService,
  Effect.gen(function* () {
    const db = yield* DB;

    return {
      getDashboard: (userId) =>
        Effect.gen(function* () {
          const memberships = yield* db
            .select({ testId: testUser.testId, role: testUser.role })
            .from(testUser)
            .where(and(eq(testUser.userId, userId), or(eq(testUser.role, "owner"), eq(testUser.role, "editor"))));

          const editableIds = memberships.map((item) => item.testId);
          const editableRows =
            editableIds.length > 0
              ? yield* db
                  .select({
                    id: test.id,
                    slug: test.slug,
                    title: test.title,
                    description: test.description,
                    status: test.status,
                    updatedAt: test.updatedAt,
                    publishedAt: test.publishedAt,
                  })
                  .from(test)
                  .where(inArray(test.id, editableIds))
                  .orderBy(desc(test.updatedAt))
                  .limit(8)
              : [];

          const responseRows = yield* db
            .select({
              id: testResponse.id,
              testId: test.id,
              testTitle: test.title,
              status: testResponse.status,
              updatedAt: testResponse.updatedAt,
              submittedAt: testResponse.submittedAt,
            })
            .from(testResponse)
            .innerJoin(test, eq(testResponse.testId, test.id))
            .where(eq(testResponse.userId, userId))
            .orderBy(desc(testResponse.updatedAt))
            .limit(6);

          const ids = editableRows.map((row) => row.id);
          const editorCounts =
            ids.length > 0
              ? yield* db
                  .select({ testId: testUser.testId, count: count(testUser.userId) })
                  .from(testUser)
                  .where(and(inArray(testUser.testId, ids), eq(testUser.role, "editor")))
                  .groupBy(testUser.testId)
              : [];
          const responseCounts =
            ids.length > 0
              ? yield* db
                  .select({ testId: testResponse.testId, count: count(testResponse.id) })
                  .from(testResponse)
                  .where(inArray(testResponse.testId, ids))
                  .groupBy(testResponse.testId)
              : [];

          const editorCountMap = new Map(editorCounts.map((item) => [item.testId, item.count]));
          const responseCountMap = new Map(responseCounts.map((item) => [item.testId, item.count]));
          const membershipMap = new Map(memberships.map((item) => [item.testId, item.role as TestPermission]));

          const summaries = yield* Effect.forEach(editableRows, (row) =>
            Effect.gen(function* () {
              const owner = yield* getOwnerProfile(db, row.id);
              return toTestSummary({
                ...row,
                ownerName: owner?.name ?? "Unknown owner",
                viewerPermission: membershipMap.get(row.id) ?? "editor",
                editorCount: editorCountMap.get(row.id) ?? 0,
                responseCount: responseCountMap.get(row.id) ?? 0,
              });
            }),
          );

          return {
            drafts: summaries.filter((item) => item.status === "draft").slice(0, 4),
            published: summaries.filter((item) => item.status === "published").slice(0, 4),
            recentResponses: responseRows.map((row) => ({
              id: row.id,
              testId: row.testId,
              testTitle: row.testTitle,
              status: row.status as "draft" | "submitted",
              updatedAt: row.updatedAt.toISOString(),
              submittedAt: toIso(row.submittedAt),
            })),
          } satisfies DashboardView;
        }),
      getTestsList: (userId, scope) =>
        Effect.gen(function* () {
          const memberships = yield* db.select({ testId: testUser.testId, role: testUser.role }).from(testUser).where(eq(testUser.userId, userId));
          const membershipMap = new Map(memberships.map((item) => [item.testId, item.role as TestPermission]));
          const ownedIds = memberships.filter((item) => item.role === "owner").map((item) => item.testId);
          const sharedMembershipIds = memberships.filter((item) => item.role !== "owner").map((item) => item.testId);
          const targetIds = scope === "shared" ? sharedMembershipIds : ownedIds;
          const baseRows =
            targetIds.length > 0
              ? yield* db
                  .select({
                    id: test.id,
                    slug: test.slug,
                    title: test.title,
                    description: test.description,
                    status: test.status,
                    updatedAt: test.updatedAt,
                    publishedAt: test.publishedAt,
                  })
                  .from(test)
                  .where(
                    and(
                      inArray(test.id, targetIds),
                      scope === "shared" ? eq(test.status, "published") : eq(test.status, scope === "drafts" ? "draft" : "published"),
                    ),
                  )
                  .orderBy(desc(test.updatedAt))
              : [];

          const ids = baseRows.map((row) => row.id);
          const editorCounts =
            ids.length > 0
              ? yield* db
                  .select({ testId: testUser.testId, count: count(testUser.userId) })
                  .from(testUser)
                  .where(and(inArray(testUser.testId, ids), eq(testUser.role, "editor")))
                  .groupBy(testUser.testId)
              : [];
          const responseCounts =
            ids.length > 0
              ? yield* db
                  .select({ testId: testResponse.testId, count: count(testResponse.id) })
                  .from(testResponse)
                  .where(inArray(testResponse.testId, ids))
                  .groupBy(testResponse.testId)
              : [];

          const editorCountMap = new Map(editorCounts.map((item) => [item.testId, item.count]));
          const responseCountMap = new Map(responseCounts.map((item) => [item.testId, item.count]));

          return yield* Effect.forEach(baseRows, (row) =>
            Effect.gen(function* () {
              const owner = yield* getOwnerProfile(db, row.id);
              return toTestSummary({
                ...row,
                ownerName: owner?.name ?? "Unknown owner",
                viewerPermission: membershipMap.get(row.id) ?? "taker",
                editorCount: editorCountMap.get(row.id) ?? 0,
                responseCount: responseCountMap.get(row.id) ?? 0,
              });
            }),
          );
        }),
      getEditorView: (testId, userId) =>
        Effect.gen(function* () {
          const permission = yield* getTestPermission(db, testId, userId);
          if (permission !== "owner" && permission !== "editor") {
            return yield* Effect.fail(new ForbiddenTestAccess({ message: "Forbidden" }));
          }

          const resolvedTest = yield* getCurrentTestRecord(db, testId);
          const owner = yield* getOwnerProfile(db, resolvedTest.id);

          return {
            test: toTestMetaView(resolvedTest, owner),
            collaborators: yield* getCollaborators(db, resolvedTest.id),
            takerInvites: yield* getTakerInvites(db, resolvedTest.id),
            questions: yield* getQuestions(db, resolvedTest.id),
            responseCount: yield* getResponseCount(db, resolvedTest.id),
            viewerPermission: permission,
          } satisfies TestEditorView;
        }),
      getTakeView: (testId, userId) =>
        Effect.gen(function* () {
          const resolvedUser = yield* getCurrentUserRecord(db, userId);
          const resolvedTest = yield* getCurrentTestRecord(db, testId);
          let permission = yield* getTestPermission(db, testId, userId);
          const owner = yield* getOwnerProfile(db, resolvedTest.id);
          const [response] = yield* db.select().from(testResponse).where(and(eq(testResponse.testId, testId), eq(testResponse.userId, userId))).limit(1);
          const invite =
            !permission && resolvedTest.status === "published"
              ? yield* db
                  .select()
                  .from(testEmailAccess)
                  .where(
                    and(
                      eq(testEmailAccess.testId, testId),
                      eq(testEmailAccess.email, normalizeEmail(resolvedUser.email)),
                      eq(testEmailAccess.role, "taker"),
                    ),
                  )
                  .limit(1)
                  .pipe(Effect.map((rows) => rows[0] ?? null))
              : null;

          if (invite?.role === "taker") {
            yield* db.insert(testUser).values({
              testId,
              userId,
              role: invite.role,
              grantedByUserId: invite.grantedByUserId,
            }).onConflictDoNothing();

            yield* db.delete(testEmailAccess).where(eq(testEmailAccess.id, invite.id));
            permission = "taker";
          }

          if (!permission) {
            return yield* Effect.fail(new ForbiddenTestAccess({ message: "Forbidden" }));
          }

          const answerRows = response ? yield* db.select().from(responseAnswer).where(eq(responseAnswer.responseId, response.id)) : [];

          return {
            test: toTestMetaView(resolvedTest, owner),
            questions: yield* getQuestions(db, resolvedTest.id),
            response: {
              id: response?.id ?? null,
              status: (response?.status as "draft" | "submitted" | undefined) ?? null,
              startedAt: toIso(response?.startedAt ?? null),
              submittedAt: toIso(response?.submittedAt ?? null),
              lastAutosavedAt: toIso(response?.lastAutosavedAt ?? null),
              answers: Object.fromEntries(answerRows.map((row) => [row.questionId, row.choiceId])),
            },
            viewerPermission: permission,
            canEdit: permission === "owner" || permission === "editor",
          } satisfies TestTakeView;
        }),
      getMyResponses: (userId) =>
        Effect.gen(function* () {
          const rows = yield* db
            .select({
              id: testResponse.id,
              testId: test.id,
              testTitle: test.title,
              status: testResponse.status,
              updatedAt: testResponse.updatedAt,
              submittedAt: testResponse.submittedAt,
            })
            .from(testResponse)
            .innerJoin(test, eq(testResponse.testId, test.id))
            .where(eq(testResponse.userId, userId))
            .orderBy(desc(testResponse.updatedAt));

          return rows.map((row) => ({
            id: row.id,
            testId: row.testId,
            testTitle: row.testTitle,
            status: row.status as "draft" | "submitted",
            updatedAt: row.updatedAt.toISOString(),
            submittedAt: toIso(row.submittedAt),
          }));
        }),
      getResponsesTable: (testId, userId, search) =>
        Effect.gen(function* () {
          yield* requireEditAccess(db, testId, userId);
          return yield* getResponsesTableRows(db, testId, search);
        }),
      getResponseReview: (testId, responseId, userId) =>
        Effect.gen(function* () {
          const permission = yield* requireEditAccess(db, testId, userId);
          const resolvedTest = yield* getCurrentTestRecord(db, testId);
          const owner = yield* getOwnerProfile(db, resolvedTest.id);
          const [currentResponse] = yield* db
            .select()
            .from(testResponse)
            .where(and(eq(testResponse.id, responseId), eq(testResponse.testId, testId)))
            .limit(1);
          const resolvedResponse = yield* requirePresent(currentResponse, new ResponseNotFound({ message: "Response not found" }));
          const [responder] = yield* db.select().from(user).where(eq(user.id, resolvedResponse.userId)).limit(1);
          const answers = yield* db.select().from(responseAnswer).where(eq(responseAnswer.responseId, resolvedResponse.id));

          return {
            test: toTestMetaView(resolvedTest, owner),
            questions: yield* getQuestions(db, testId),
            response: {
              id: resolvedResponse.id,
              status: resolvedResponse.status as "draft" | "submitted",
              startedAt: resolvedResponse.startedAt.toISOString(),
              submittedAt: toIso(resolvedResponse.submittedAt),
              lastAutosavedAt: toIso(resolvedResponse.lastAutosavedAt),
              answers: Object.fromEntries(answers.map((row) => [row.questionId, row.choiceId])),
            },
            responder: {
              id: responder?.id ?? resolvedResponse.userId,
              name: responder?.name ?? "Unknown user",
              email: responder?.email ?? "Unknown email",
              image: responder?.image ?? null,
            },
            viewerPermission: permission,
          } satisfies ResponseReviewView;
        }),
    };
  }),
);
