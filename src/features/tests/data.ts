import { Effect } from "effect";
import { and, asc, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import {
  ConflictError,
  ForbiddenError,
  InvalidStateError,
  NotFoundError,
} from "@/backend/errors";
import { DB, type DBService } from "@/db/effect";
import {
  questionChoice,
  responseAnswer,
  test,
  testEmailAccess,
  testQuestion,
  testResponse,
  testUser,
  user,
} from "@/db/schema";
import { createId, createSlug } from "@/features/common/ids";
import type {
  Collaborator,
  DashboardView,
  QuestionView,
  ResponseReviewView,
  ResponseTableRow,
  TestEditorView,
  TestPermission,
  TestSummary,
  TestTakeView,
  TakerInvite,
} from "./types";

type DbClient = Omit<DBService, "$client">;

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function requirePresent<T>(value: T | undefined | null, message: string) {
  return value == null
    ? Effect.fail(new NotFoundError({ message }))
    : Effect.succeed(value);
}

const getOwnerProfile = (db: DbClient, testId: string) =>
  db
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

export const getTestPermission = (testId: string, userId: string) =>
  Effect.gen(function* () {
    const db = yield* DB;
    const [membership] = yield* db
      .select()
      .from(testUser)
      .where(and(eq(testUser.testId, testId), eq(testUser.userId, userId)))
      .limit(1);

    return (membership?.role as TestPermission | undefined) ?? null;
  });

export const requireTestEditAccess = (testId: string, userId: string) =>
  Effect.gen(function* () {
    const permission = yield* getTestPermission(testId, userId);

    if (permission !== "owner" && permission !== "editor") {
      return yield* Effect.fail(new ForbiddenError({ message: "Forbidden" }));
    }

    return permission;
  });

export const requireResponseReviewAccess = (testId: string, userId: string) =>
  requireTestEditAccess(testId, userId);

export const requireTestViewAccess = (testId: string, userId: string) =>
  Effect.gen(function* () {
    const permission = yield* getTestPermission(testId, userId);

    if (!permission) {
      return yield* Effect.fail(new ForbiddenError({ message: "Forbidden" }));
    }

    return permission;
  });

const getQuestions = (db: DbClient, testId: string) =>
  Effect.gen(function* () {
    const questions = yield* db
      .select()
      .from(testQuestion)
      .where(eq(testQuestion.testId, testId))
      .orderBy(asc(testQuestion.position));

    const questionIds = questions.map((item) => item.id);
    const choices =
      questionIds.length > 0
        ? yield* db
            .select()
            .from(questionChoice)
            .where(inArray(questionChoice.questionId, questionIds))
            .orderBy(asc(questionChoice.position))
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

const getCollaborators = (db: DbClient, currentTest: typeof test.$inferSelect) =>
  db
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
        eq(testUser.testId, currentTest.id),
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

const getTakerInvites = (db: DbClient, currentTest: typeof test.$inferSelect) =>
  db
    .select({
      id: testEmailAccess.id,
      email: testEmailAccess.email,
      createdAt: testEmailAccess.createdAt,
      lastSentAt: testEmailAccess.lastSentAt,
    })
    .from(testEmailAccess)
    .where(and(eq(testEmailAccess.testId, currentTest.id), eq(testEmailAccess.role, "taker")))
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

const getResponseCount = (db: DbClient, testId: string) =>
  db
    .select({
      value: count(testResponse.id),
    })
    .from(testResponse)
    .where(eq(testResponse.testId, testId))
    .pipe(Effect.map(([result]) => result?.value ?? 0));

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

export const getDashboard = (userId: string) =>
  Effect.gen(function* () {
    const db = yield* DB;
    const memberships = yield* db
      .select({
        testId: testUser.testId,
        role: testUser.role,
      })
      .from(testUser)
      .where(
        and(
          eq(testUser.userId, userId),
          or(eq(testUser.role, "owner"), eq(testUser.role, "editor")),
        ),
      );

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
            .select({
              testId: testUser.testId,
              count: count(testUser.userId),
            })
            .from(testUser)
            .where(and(inArray(testUser.testId, ids), eq(testUser.role, "editor")))
            .groupBy(testUser.testId)
        : [];
    const responseCounts =
      ids.length > 0
        ? yield* db
            .select({
              testId: testResponse.testId,
              count: count(testResponse.id),
            })
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
  });

export const getTestsList = (userId: string, scope: "drafts" | "published" | "shared") =>
  Effect.gen(function* () {
    const db = yield* DB;
    const memberships = yield* db
      .select({
        testId: testUser.testId,
        role: testUser.role,
      })
      .from(testUser)
      .where(eq(testUser.userId, userId));

    const membershipMap = new Map(memberships.map((item) => [item.testId, item.role as TestPermission]));
    const ownedIds = memberships.filter((item) => item.role === "owner").map((item) => item.testId);
    const sharedMembershipIds = memberships
      .filter((item) => item.role !== "owner")
      .map((item) => item.testId);
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
                scope === "shared"
                  ? eq(test.status, "published")
                  : eq(test.status, scope === "drafts" ? "draft" : "published"),
              ),
            )
            .orderBy(desc(test.updatedAt))
        : [];

    const ids = baseRows.map((row) => row.id);
    const editorCounts =
      ids.length > 0
        ? yield* db
            .select({
              testId: testUser.testId,
              count: count(testUser.userId),
            })
            .from(testUser)
            .where(and(inArray(testUser.testId, ids), eq(testUser.role, "editor")))
            .groupBy(testUser.testId)
        : [];
    const responseCounts =
      ids.length > 0
        ? yield* db
            .select({
              testId: testResponse.testId,
              count: count(testResponse.id),
            })
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
  });

export const createTestRecord = (userId: string, title: string) =>
  Effect.gen(function* () {
    const db = yield* DB;
    const id = createId();
    const [created] = yield* db
      .insert(test)
      .values({
        id,
        slug: createSlug(title),
        title,
        description: "",
        status: "draft",
      })
      .returning();

    const resolvedCreated = yield* requirePresent(created, "Failed to create test");

    yield* db.insert(testUser).values({
      testId: id,
      userId,
      role: "owner",
      grantedByUserId: userId,
    });

    return resolvedCreated;
  });

export const getEditorView = (testId: string, userId: string) =>
  Effect.gen(function* () {
    const db = yield* DB;
    const permission = yield* requireTestEditAccess(testId, userId);
    const [currentTest] = yield* db.select().from(test).where(eq(test.id, testId)).limit(1);
    const resolvedTest = yield* requirePresent(currentTest, "Test not found");
    const owner = yield* getOwnerProfile(db, resolvedTest.id);

    return {
      test: {
        id: resolvedTest.id,
        slug: resolvedTest.slug,
        title: resolvedTest.title,
        description: resolvedTest.description,
        status: resolvedTest.status as TestEditorView["test"]["status"],
        ownerUserId: owner?.id ?? "",
        ownerName: owner?.name ?? "Unknown owner",
        publishedAt: toIso(resolvedTest.publishedAt),
        updatedAt: resolvedTest.updatedAt.toISOString(),
        createdAt: resolvedTest.createdAt.toISOString(),
      },
      collaborators: yield* getCollaborators(db, resolvedTest),
      takerInvites: yield* getTakerInvites(db, resolvedTest),
      questions: yield* getQuestions(db, resolvedTest.id),
      responseCount: yield* getResponseCount(db, resolvedTest.id),
      viewerPermission: permission,
    } satisfies TestEditorView;
  });

export const getTakeView = (testId: string, userId: string) =>
  Effect.gen(function* () {
    const db = yield* DB;
    const [currentUser] = yield* db.select().from(user).where(eq(user.id, userId)).limit(1);
    const resolvedUser = yield* requirePresent(currentUser, "User not found");
    const [currentTest] = yield* db.select().from(test).where(eq(test.id, testId)).limit(1);
    const resolvedTest = yield* requirePresent(currentTest, "Test not found");
    let permission = yield* getTestPermission(testId, userId);
    const owner = yield* getOwnerProfile(db, resolvedTest.id);
    const [response] = yield* db
      .select()
      .from(testResponse)
      .where(and(eq(testResponse.testId, testId), eq(testResponse.userId, userId)))
      .limit(1);
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
      yield* db
        .insert(testUser)
        .values({
          testId,
          userId,
          role: invite.role,
          grantedByUserId: invite.grantedByUserId,
        })
        .onConflictDoNothing();

      yield* db.delete(testEmailAccess).where(eq(testEmailAccess.id, invite.id));
      permission = "taker";
    }

    if (!permission) {
      return yield* Effect.fail(new ForbiddenError({ message: "Forbidden" }));
    }

    const answerRows = response
      ? yield* db.select().from(responseAnswer).where(eq(responseAnswer.responseId, response.id))
      : [];

    return {
      test: {
        id: resolvedTest.id,
        slug: resolvedTest.slug,
        title: resolvedTest.title,
        description: resolvedTest.description,
        status: resolvedTest.status as TestTakeView["test"]["status"],
        ownerUserId: owner?.id ?? "",
        ownerName: owner?.name ?? "Unknown owner",
        publishedAt: toIso(resolvedTest.publishedAt),
        updatedAt: resolvedTest.updatedAt.toISOString(),
        createdAt: resolvedTest.createdAt.toISOString(),
      },
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
  });

export const getMyResponses = (userId: string) =>
  Effect.gen(function* () {
    const db = yield* DB;
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
  });

export const updateTestMeta = (
  testId: string,
  userId: string,
  values: { title: string; description: string | null },
) =>
  Effect.gen(function* () {
    const db = yield* DB;
    yield* requireTestEditAccess(testId, userId);

    const [updated] = yield* db
      .update(test)
      .set({
        title: values.title,
        description: values.description,
        updatedAt: new Date(),
      })
      .where(eq(test.id, testId))
      .returning();

    return yield* requirePresent(updated, "Test not found");
  });

function shiftQuestionPositions(client: DbClient, testId: string, fromPosition: number) {
  return Effect.gen(function* () {
    const questions = yield* client
      .select()
      .from(testQuestion)
      .where(eq(testQuestion.testId, testId))
      .orderBy(asc(testQuestion.position));

    for (const item of questions
      .filter((question) => question.position >= fromPosition)
      .sort((left, right) => right.position - left.position)) {
      yield* client
        .update(testQuestion)
        .set({
          position: item.position + 1,
          updatedAt: new Date(),
        })
        .where(eq(testQuestion.id, item.id));
    }
  });
}

function shiftChoicePositions(client: DbClient, questionId: string, fromPosition: number) {
  return Effect.gen(function* () {
    const choices = yield* client
      .select()
      .from(questionChoice)
      .where(eq(questionChoice.questionId, questionId))
      .orderBy(asc(questionChoice.position));

    for (const item of choices
      .filter((choice) => choice.position >= fromPosition)
      .sort((left, right) => right.position - left.position)) {
      yield* client
        .update(questionChoice)
        .set({
          position: item.position + 1,
          updatedAt: new Date(),
        })
        .where(eq(questionChoice.id, item.id));
    }
  });
}

function applyQuestionOrder(client: DbClient, testId: string, questionIds: Array<string>) {
  return Effect.gen(function* () {
    for (const [index, questionId] of questionIds.entries()) {
      yield* client
        .update(testQuestion)
        .set({
          position: questionIds.length + index,
          updatedAt: new Date(),
        })
        .where(and(eq(testQuestion.id, questionId), eq(testQuestion.testId, testId)));
    }

    for (const [index, questionId] of questionIds.entries()) {
      yield* client
        .update(testQuestion)
        .set({
          position: index,
          updatedAt: new Date(),
        })
        .where(and(eq(testQuestion.id, questionId), eq(testQuestion.testId, testId)));
    }
  });
}

function applyChoiceOrder(client: DbClient, questionId: string, choiceIds: Array<string>) {
  return Effect.gen(function* () {
    for (const [index, choiceId] of choiceIds.entries()) {
      yield* client
        .update(questionChoice)
        .set({
          position: choiceIds.length + index,
          updatedAt: new Date(),
        })
        .where(and(eq(questionChoice.id, choiceId), eq(questionChoice.questionId, questionId)));
    }

    for (const [index, choiceId] of choiceIds.entries()) {
      yield* client
        .update(questionChoice)
        .set({
          position: index,
          updatedAt: new Date(),
        })
        .where(and(eq(questionChoice.id, choiceId), eq(questionChoice.questionId, questionId)));
    }
  });
}

export const addQuestion = (testId: string, userId: string, afterQuestionId?: string | null) =>
  Effect.gen(function* () {
    const db = yield* DB;
    yield* requireTestEditAccess(testId, userId);

    const questions = yield* db
      .select()
      .from(testQuestion)
      .where(eq(testQuestion.testId, testId))
      .orderBy(asc(testQuestion.position));

    const anchorPosition = afterQuestionId
      ? (questions.find((item) => item.id === afterQuestionId)?.position ?? questions.length - 1) + 1
      : questions.length;

    const questionId = createId();
    yield* db.transaction((tx) =>
      Effect.gen(function* () {
        yield* shiftQuestionPositions(tx, testId, anchorPosition);

        yield* tx.insert(testQuestion).values({
          id: questionId,
          testId,
          position: anchorPosition,
          prompt: "Untitled question",
          description: "",
          required: true,
          type: "multiple_choice",
        });

        for (const [index, label] of ["Option A", "Option B"].entries()) {
          yield* tx.insert(questionChoice).values({
            id: createId(),
            questionId,
            position: index,
            label,
          });
        }

        yield* tx.update(test).set({ updatedAt: new Date() }).where(eq(test.id, testId));
      }),
    );
  });

export const updateQuestion = (
  questionId: string,
  userId: string,
  values: { prompt?: string; description?: string | null; required?: boolean },
) =>
  Effect.gen(function* () {
    const db = yield* DB;
    const [question] = yield* db.select().from(testQuestion).where(eq(testQuestion.id, questionId)).limit(1);
    const resolvedQuestion = yield* requirePresent(question, "Question not found");

    yield* requireTestEditAccess(resolvedQuestion.testId, userId);

    yield* db
      .update(testQuestion)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(eq(testQuestion.id, questionId));
  });

export const reorderQuestions = (testId: string, userId: string, questionIds: Array<string>) =>
  Effect.gen(function* () {
    const db = yield* DB;
    yield* requireTestEditAccess(testId, userId);

    yield* db.transaction((tx) =>
      Effect.gen(function* () {
        yield* applyQuestionOrder(tx, testId, questionIds);
        yield* tx.update(test).set({ updatedAt: new Date() }).where(eq(test.id, testId));
      }),
    );
  });

export const addChoice = (questionId: string, userId: string, afterChoiceId?: string | null) =>
  Effect.gen(function* () {
    const db = yield* DB;
    const [question] = yield* db.select().from(testQuestion).where(eq(testQuestion.id, questionId)).limit(1);
    const resolvedQuestion = yield* requirePresent(question, "Question not found");

    yield* requireTestEditAccess(resolvedQuestion.testId, userId);

    const choices = yield* db
      .select()
      .from(questionChoice)
      .where(eq(questionChoice.questionId, questionId))
      .orderBy(asc(questionChoice.position));

    const anchorPosition = afterChoiceId
      ? (choices.find((item) => item.id === afterChoiceId)?.position ?? choices.length - 1) + 1
      : choices.length;

    yield* db.transaction((tx) =>
      Effect.gen(function* () {
        yield* shiftChoicePositions(tx, questionId, anchorPosition);

        yield* tx.insert(questionChoice).values({
          id: createId(),
          questionId,
          position: anchorPosition,
          label: "New option",
        });

        yield* tx
          .update(test)
          .set({ updatedAt: new Date() })
          .where(eq(test.id, resolvedQuestion.testId));
      }),
    );
  });

export const updateChoice = (choiceId: string, userId: string, label: string) =>
  Effect.gen(function* () {
    const db = yield* DB;
    const [choice] = yield* db.select().from(questionChoice).where(eq(questionChoice.id, choiceId)).limit(1);
    const resolvedChoice = yield* requirePresent(choice, "Choice not found");
    const [question] = yield* db
      .select()
      .from(testQuestion)
      .where(eq(testQuestion.id, resolvedChoice.questionId))
      .limit(1);
    const resolvedQuestion = yield* requirePresent(question, "Question not found");

    yield* requireTestEditAccess(resolvedQuestion.testId, userId);

    yield* db
      .update(questionChoice)
      .set({
        label,
        updatedAt: new Date(),
      })
      .where(eq(questionChoice.id, choiceId));
  });

export const reorderChoices = (questionId: string, userId: string, choiceIds: Array<string>) =>
  Effect.gen(function* () {
    const db = yield* DB;
    const [question] = yield* db.select().from(testQuestion).where(eq(testQuestion.id, questionId)).limit(1);
    const resolvedQuestion = yield* requirePresent(question, "Question not found");

    yield* requireTestEditAccess(resolvedQuestion.testId, userId);

    yield* db.transaction((tx) =>
      Effect.gen(function* () {
        yield* applyChoiceOrder(tx, questionId, choiceIds);
        yield* tx
          .update(test)
          .set({ updatedAt: new Date() })
          .where(eq(test.id, resolvedQuestion.testId));
      }),
    );
  });

export const deleteQuestion = (questionId: string, userId: string) =>
  Effect.gen(function* () {
    const db = yield* DB;
    const [question] = yield* db.select().from(testQuestion).where(eq(testQuestion.id, questionId)).limit(1);
    const resolvedQuestion = yield* requirePresent(question, "Question not found");

    yield* requireTestEditAccess(resolvedQuestion.testId, userId);

    yield* db.delete(testQuestion).where(eq(testQuestion.id, questionId));

    const remaining = yield* db
      .select()
      .from(testQuestion)
      .where(eq(testQuestion.testId, resolvedQuestion.testId))
      .orderBy(asc(testQuestion.position));

    yield* Effect.forEach(remaining, (item, index) =>
      db
        .update(testQuestion)
        .set({ position: index, updatedAt: new Date() })
        .where(eq(testQuestion.id, item.id)),
    );
  });

export const deleteChoice = (choiceId: string, userId: string) =>
  Effect.gen(function* () {
    const db = yield* DB;
    const [choice] = yield* db.select().from(questionChoice).where(eq(questionChoice.id, choiceId)).limit(1);
    const resolvedChoice = yield* requirePresent(choice, "Choice not found");
    const [question] = yield* db
      .select()
      .from(testQuestion)
      .where(eq(testQuestion.id, resolvedChoice.questionId))
      .limit(1);
    const resolvedQuestion = yield* requirePresent(question, "Question not found");

    yield* requireTestEditAccess(resolvedQuestion.testId, userId);

    const existingChoices = yield* db
      .select()
      .from(questionChoice)
      .where(eq(questionChoice.questionId, resolvedQuestion.id));

    if (existingChoices.length <= 2) {
      return yield* Effect.fail(
        new ConflictError({ message: "Each question must keep at least two choices" }),
      );
    }

    yield* db.delete(questionChoice).where(eq(questionChoice.id, choiceId));

    const remaining = yield* db
      .select()
      .from(questionChoice)
      .where(eq(questionChoice.questionId, resolvedQuestion.id))
      .orderBy(asc(questionChoice.position));

    yield* Effect.forEach(remaining, (item, index) =>
      db
        .update(questionChoice)
        .set({ position: index, updatedAt: new Date() })
        .where(eq(questionChoice.id, item.id)),
    );
  });

export const publishTest = (testId: string, userId: string) =>
  Effect.gen(function* () {
    const db = yield* DB;
    const permission = yield* requireTestEditAccess(testId, userId);

    if (permission !== "owner") {
      return yield* Effect.fail(new ForbiddenError({ message: "Only owners can publish tests" }));
    }

    const questions = yield* db.select().from(testQuestion).where(eq(testQuestion.testId, testId));

    if (questions.length === 0) {
      return yield* Effect.fail(
        new InvalidStateError({ message: "Add at least one question before publishing" }),
      );
    }

    yield* db
      .update(test)
      .set({
        status: "published",
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(test.id, testId));
  });

export const addEditor = (testId: string, ownerUserId: string, email: string) =>
  Effect.gen(function* () {
    const db = yield* DB;
    const permission = yield* requireTestEditAccess(testId, ownerUserId);

    if (permission !== "owner") {
      return yield* Effect.fail(new ForbiddenError({ message: "Only owners can add editors" }));
    }

    const [invitedUser] = yield* db.select().from(user).where(eq(user.email, email)).limit(1);

    if (!invitedUser) {
      return yield* Effect.fail(
        new NotFoundError({ message: "No registered user exists with that email" }),
      );
    }

    const [existingMembership] = yield* db
      .select()
      .from(testUser)
      .where(and(eq(testUser.testId, testId), eq(testUser.userId, invitedUser.id)))
      .limit(1);

    if (existingMembership?.role === "owner") {
      return yield* Effect.fail(new ConflictError({ message: "The owner already has access" }));
    }

    if (existingMembership?.role === "editor") {
      return;
    }

    if (existingMembership) {
      yield* db
        .update(testUser)
        .set({
          role: "editor",
          grantedByUserId: ownerUserId,
        })
        .where(and(eq(testUser.testId, testId), eq(testUser.userId, invitedUser.id)));

      return;
    }

    yield* db.insert(testUser).values({
      testId,
      userId: invitedUser.id,
      role: "editor",
      grantedByUserId: ownerUserId,
    });
  });

export const removeEditor = (testId: string, ownerUserId: string, targetUserId: string) =>
  Effect.gen(function* () {
    const db = yield* DB;
    const permission = yield* requireTestEditAccess(testId, ownerUserId);

    if (permission !== "owner") {
      return yield* Effect.fail(new ForbiddenError({ message: "Only owners can remove editors" }));
    }

    yield* db
      .delete(testUser)
      .where(
        and(
          eq(testUser.testId, testId),
          eq(testUser.userId, targetUserId),
          eq(testUser.role, "editor"),
        ),
      );
  });

const getOrCreateResponse = (db: DbClient, testId: string, userId: string) =>
  Effect.gen(function* () {
    const [existing] = yield* db
      .select()
      .from(testResponse)
      .where(and(eq(testResponse.testId, testId), eq(testResponse.userId, userId)))
      .limit(1);

    if (existing) {
      return existing;
    }

    const [created] = yield* db
      .insert(testResponse)
      .values({
        id: createId(),
        testId,
        userId,
        status: "draft",
        startedAt: new Date(),
        lastAutosavedAt: new Date(),
      })
      .returning();

    return yield* requirePresent(created, "Failed to create response");
  });

export const saveAnswer = (
  testId: string,
  userId: string,
  questionId: string,
  choiceId: string,
) =>
  Effect.gen(function* () {
    const db = yield* DB;
    const permission = yield* requireTestViewAccess(testId, userId);

    if (permission === "owner" || permission === "editor") {
      const [currentTest] = yield* db.select().from(test).where(eq(test.id, testId)).limit(1);

      if (currentTest?.status !== "published") {
        return yield* Effect.fail(
          new InvalidStateError({ message: "Only published tests can collect responses" }),
        );
      }
    }

    const [question] = yield* db
      .select()
      .from(testQuestion)
      .where(and(eq(testQuestion.id, questionId), eq(testQuestion.testId, testId)))
      .limit(1);
    yield* requirePresent(question, "Question not found");

    const [choice] = yield* db
      .select()
      .from(questionChoice)
      .where(and(eq(questionChoice.id, choiceId), eq(questionChoice.questionId, questionId)))
      .limit(1);
    yield* requirePresent(choice, "Choice does not belong to question");

    const response = yield* getOrCreateResponse(db, testId, userId);

    if (response.status === "submitted") {
      return yield* Effect.fail(new ConflictError({ message: "Response already submitted" }));
    }

    const [existingAnswer] = yield* db
      .select()
      .from(responseAnswer)
      .where(and(eq(responseAnswer.responseId, response.id), eq(responseAnswer.questionId, questionId)))
      .limit(1);

    if (existingAnswer) {
      yield* db
        .update(responseAnswer)
        .set({
          choiceId,
          updatedAt: new Date(),
        })
        .where(eq(responseAnswer.id, existingAnswer.id));
    } else {
      yield* db.insert(responseAnswer).values({
        id: createId(),
        responseId: response.id,
        questionId,
        choiceId,
      });
    }

    const [updatedResponse] = yield* db
      .update(testResponse)
      .set({
        lastAutosavedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(testResponse.id, response.id))
      .returning();

    return yield* requirePresent(updatedResponse, "Response not found");
  });

export const submitResponse = (testId: string, userId: string) =>
  Effect.gen(function* () {
    const db = yield* DB;
    yield* requireTestViewAccess(testId, userId);

    const [currentTest] = yield* db.select().from(test).where(eq(test.id, testId)).limit(1);
    const resolvedTest = yield* requirePresent(currentTest, "Test not found");

    if (resolvedTest.status !== "published") {
      return yield* Effect.fail(
        new InvalidStateError({ message: "Only published tests can be submitted" }),
      );
    }

    const questions = yield* getQuestions(db, testId);
    const response = yield* getOrCreateResponse(db, testId, userId);

    if (response.status === "submitted") {
      return response;
    }

    const answers = yield* db.select().from(responseAnswer).where(eq(responseAnswer.responseId, response.id));
    const answerMap = new Map(answers.map((answer) => [answer.questionId, answer.choiceId]));
    const missingRequired = questions.some(
      (question) => question.required && !answerMap.has(question.id),
    );

    if (missingRequired) {
      return yield* Effect.fail(
        new InvalidStateError({ message: "Complete all required questions before submitting" }),
      );
    }

    const [submitted] = yield* db
      .update(testResponse)
      .set({
        status: "submitted",
        submittedAt: new Date(),
        lastAutosavedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(testResponse.id, response.id))
      .returning();

    return yield* requirePresent(submitted, "Response not found");
  });

export const getResponsesTable = (
  testId: string,
  userId: string,
  search: {
    page: number;
    query: string;
    status: "all" | "draft" | "submitted";
    sortBy: "startedAt" | "submittedAt";
    direction: "asc" | "desc";
  },
) =>
  Effect.gen(function* () {
    const db = yield* DB;
    yield* requireResponseReviewAccess(testId, userId);

    const sortColumn =
      search.sortBy === "startedAt" ? testResponse.startedAt : testResponse.submittedAt;
    const order = search.direction === "asc" ? asc(sortColumn) : desc(sortColumn);
    const conditions = [
      eq(testResponse.testId, testId),
      search.status === "all" ? undefined : eq(testResponse.status, search.status),
      search.query
        ? or(ilike(user.name, `%${search.query}%`), ilike(user.email, `%${search.query}%`))
        : undefined,
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

export const getResponseReview = (testId: string, responseId: string, userId: string) =>
  Effect.gen(function* () {
    const db = yield* DB;
    const permission = yield* requireResponseReviewAccess(testId, userId);
    const [currentTest] = yield* db.select().from(test).where(eq(test.id, testId)).limit(1);
    const resolvedTest = yield* requirePresent(currentTest, "Test not found");
    const owner = yield* getOwnerProfile(db, resolvedTest.id);
    const [currentResponse] = yield* db
      .select()
      .from(testResponse)
      .where(and(eq(testResponse.id, responseId), eq(testResponse.testId, testId)))
      .limit(1);
    const resolvedResponse = yield* requirePresent(currentResponse, "Response not found");
    const [responder] = yield* db
      .select()
      .from(user)
      .where(eq(user.id, resolvedResponse.userId))
      .limit(1);
    const answers = yield* db.select().from(responseAnswer).where(eq(responseAnswer.responseId, resolvedResponse.id));

    return {
      test: {
        id: resolvedTest.id,
        slug: resolvedTest.slug,
        title: resolvedTest.title,
        description: resolvedTest.description,
        status: resolvedTest.status as ResponseReviewView["test"]["status"],
        ownerUserId: owner?.id ?? "",
        ownerName: owner?.name ?? "Unknown owner",
        publishedAt: toIso(resolvedTest.publishedAt),
        updatedAt: resolvedTest.updatedAt.toISOString(),
        createdAt: resolvedTest.createdAt.toISOString(),
      },
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
  });
