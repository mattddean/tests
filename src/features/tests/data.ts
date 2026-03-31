import { and, asc, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/db";
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
import { assertPresent } from "@/lib/assert-present";
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

type DbClient = Pick<typeof db, "insert" | "select" | "update">;

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function getOwnerProfile(testId: string) {
  const owner = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    })
    .from(testUser)
    .innerJoin(user, eq(testUser.userId, user.id))
    .where(and(eq(testUser.testId, testId), eq(testUser.role, "owner")))
    .limit(1);

  return owner[0] ?? null;
}

export async function getTestPermission(
  testId: string,
  userId: string,
): Promise<TestPermission | null> {
  const membership = await db.query.testUser.findFirst({
    where: and(eq(testUser.testId, testId), eq(testUser.userId, userId)),
  });

  return (membership?.role as TestPermission | undefined) ?? null;
}

export async function requireTestEditAccess(testId: string, userId: string) {
  const permission = await getTestPermission(testId, userId);

  if (permission !== "owner" && permission !== "editor") {
    throw new Error("Forbidden");
  }

  return permission;
}

export async function requireResponseReviewAccess(testId: string, userId: string) {
  return await requireTestEditAccess(testId, userId);
}

export async function requireTestViewAccess(testId: string, userId: string) {
  const permission = await getTestPermission(testId, userId);

  if (!permission) {
    throw new Error("Forbidden");
  }

  return permission;
}

async function getQuestions(testId: string) {
  const questions = await db
    .select()
    .from(testQuestion)
    .where(eq(testQuestion.testId, testId))
    .orderBy(asc(testQuestion.position));

  const questionIds = questions.map((item) => item.id);
  const choices =
    questionIds.length > 0
      ? await db
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
}

async function getCollaborators(currentTest: typeof test.$inferSelect) {
  const membershipRows = await db
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
    .orderBy(asc(testUser.role), asc(user.name));

  return membershipRows.map((member) => ({
    id: member.id,
    email: member.email,
    name: member.name,
    image: member.image ?? null,
    role: member.role as "owner" | "editor",
    invitedAt: member.role === "editor" ? member.createdAt.toISOString() : undefined,
  })) satisfies Array<Collaborator>;
}

async function getTakerInvites(currentTest: typeof test.$inferSelect) {
  const inviteRows = await db
    .select({
      id: testEmailAccess.id,
      email: testEmailAccess.email,
      createdAt: testEmailAccess.createdAt,
      lastSentAt: testEmailAccess.lastSentAt,
    })
    .from(testEmailAccess)
    .where(and(eq(testEmailAccess.testId, currentTest.id), eq(testEmailAccess.role, "taker")))
    .orderBy(desc(testEmailAccess.lastSentAt), asc(testEmailAccess.email));

  return inviteRows.map<TakerInvite>((invite) => ({
    id: invite.id,
    email: invite.email,
    invitedAt: invite.createdAt.toISOString(),
    lastSentAt: invite.lastSentAt.toISOString(),
  }));
}

async function getResponseCount(testId: string) {
  const [result] = await db
    .select({
      value: count(testResponse.id),
    })
    .from(testResponse)
    .where(eq(testResponse.testId, testId));

  return result?.value ?? 0;
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

export async function getDashboard(userId: string) {
  const memberships = await db
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
      ? await db
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

  const responseRows = await db
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
      ? await db
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
      ? await db
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
  const summaries = editableRows.map((row) =>
    toTestSummary({
      ...row,
      ownerName: "",
      viewerPermission: membershipMap.get(row.id) ?? "editor",
      editorCount: editorCountMap.get(row.id) ?? 0,
      responseCount: responseCountMap.get(row.id) ?? 0,
    }),
  );

  for (const summary of summaries) {
    const owner = await getOwnerProfile(summary.id);
    summary.ownerName = owner?.name ?? "Unknown owner";
  }

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
}

export async function getTestsList(userId: string, scope: "drafts" | "published" | "shared") {
  const memberships = await db
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
  const targetIds =
    scope === "shared" ? sharedMembershipIds : ownedIds;
  const baseRows =
    targetIds.length > 0
      ? await db
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
      ? await db
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
      ? await db
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

  const summaries = baseRows.map((row) =>
    toTestSummary({
      ...row,
      ownerName: "Unknown owner",
      viewerPermission: membershipMap.get(row.id) ?? "taker",
      editorCount: editorCountMap.get(row.id) ?? 0,
      responseCount: responseCountMap.get(row.id) ?? 0,
    }),
  );

  for (const summary of summaries) {
    const owner = await getOwnerProfile(summary.id);
    summary.ownerName = owner?.name ?? "Unknown owner";
  }

  return summaries;
}

export async function createTestRecord(userId: string, title: string) {
  const id = createId();
  const [created] = await db
    .insert(test)
    .values({
      id,
      slug: createSlug(title),
      title,
      description: "",
      status: "draft",
    })
    .returning();

  await db.insert(testUser).values({
    testId: id,
    userId,
    role: "owner",
    grantedByUserId: userId,
  });

  return assertPresent(created, "Failed to create test");
}

export async function getEditorView(testId: string, userId: string) {
  const permission = await requireTestEditAccess(testId, userId);
  const currentTest = await db.query.test.findFirst({
    where: eq(test.id, testId),
  });
  const resolvedTest = assertPresent(currentTest, "Test not found");
  const owner = await getOwnerProfile(resolvedTest.id);

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
    collaborators: await getCollaborators(resolvedTest),
    takerInvites: await getTakerInvites(resolvedTest),
    questions: await getQuestions(resolvedTest.id),
    responseCount: await getResponseCount(resolvedTest.id),
    viewerPermission: permission,
  } satisfies TestEditorView;
}

export async function getTakeView(testId: string, userId: string) {
  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });
  const resolvedUser = assertPresent(currentUser, "User not found");
  const currentTest = await db.query.test.findFirst({
    where: eq(test.id, testId),
  });
  const resolvedTest = assertPresent(currentTest, "Test not found");
  let permission = await getTestPermission(testId, userId);
  const owner = await getOwnerProfile(resolvedTest.id);
  const response = await db.query.testResponse.findFirst({
    where: and(eq(testResponse.testId, testId), eq(testResponse.userId, userId)),
  });
  const invite =
    !permission && resolvedTest.status === "published"
      ? await db.query.testEmailAccess.findFirst({
          where: and(
            eq(testEmailAccess.testId, testId),
            eq(testEmailAccess.email, normalizeEmail(resolvedUser.email)),
            eq(testEmailAccess.role, "taker"),
          ),
        })
      : null;

  if (invite?.role === "taker") {
    await db
      .insert(testUser)
      .values({
        testId,
        userId,
        role: invite.role,
        grantedByUserId: invite.grantedByUserId,
      })
      .onConflictDoNothing();

    await db.delete(testEmailAccess).where(eq(testEmailAccess.id, invite.id));
    permission = "taker";
  }

  if (!permission) {
    throw new Error("Forbidden");
  }

  const answerRows = response
    ? await db.select().from(responseAnswer).where(eq(responseAnswer.responseId, response.id))
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
    questions: await getQuestions(resolvedTest.id),
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
}

export async function getMyResponses(userId: string) {
  const rows = await db
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
}

export async function updateTestMeta(
  testId: string,
  userId: string,
  values: { title: string; description: string | null },
) {
  await requireTestEditAccess(testId, userId);

  const [updated] = await db
    .update(test)
    .set({
      title: values.title,
      description: values.description,
      updatedAt: new Date(),
    })
    .where(eq(test.id, testId))
    .returning();

  return assertPresent(updated, "Test not found");
}

async function shiftQuestionPositions(client: DbClient, testId: string, fromPosition: number) {
  const questions = await client
    .select()
    .from(testQuestion)
    .where(eq(testQuestion.testId, testId))
    .orderBy(asc(testQuestion.position));

  for (const item of questions
    .filter((question) => question.position >= fromPosition)
    .sort((left, right) => right.position - left.position)) {
    await client
      .update(testQuestion)
      .set({
        position: item.position + 1,
        updatedAt: new Date(),
      })
      .where(eq(testQuestion.id, item.id));
  }
}

async function shiftChoicePositions(client: DbClient, questionId: string, fromPosition: number) {
  const choices = await client
    .select()
    .from(questionChoice)
    .where(eq(questionChoice.questionId, questionId))
    .orderBy(asc(questionChoice.position));

  for (const item of choices
    .filter((choice) => choice.position >= fromPosition)
    .sort((left, right) => right.position - left.position)) {
    await client
      .update(questionChoice)
      .set({
        position: item.position + 1,
        updatedAt: new Date(),
      })
      .where(eq(questionChoice.id, item.id));
  }
}

async function applyQuestionOrder(client: DbClient, testId: string, questionIds: Array<string>) {
  for (const [index, questionId] of questionIds.entries()) {
    await client
      .update(testQuestion)
      .set({
        position: questionIds.length + index,
        updatedAt: new Date(),
      })
      .where(and(eq(testQuestion.id, questionId), eq(testQuestion.testId, testId)));
  }

  for (const [index, questionId] of questionIds.entries()) {
    await client
      .update(testQuestion)
      .set({
        position: index,
        updatedAt: new Date(),
      })
      .where(and(eq(testQuestion.id, questionId), eq(testQuestion.testId, testId)));
  }
}

async function applyChoiceOrder(client: DbClient, questionId: string, choiceIds: Array<string>) {
  for (const [index, choiceId] of choiceIds.entries()) {
    await client
      .update(questionChoice)
      .set({
        position: choiceIds.length + index,
        updatedAt: new Date(),
      })
      .where(and(eq(questionChoice.id, choiceId), eq(questionChoice.questionId, questionId)));
  }

  for (const [index, choiceId] of choiceIds.entries()) {
    await client
      .update(questionChoice)
      .set({
        position: index,
        updatedAt: new Date(),
      })
      .where(and(eq(questionChoice.id, choiceId), eq(questionChoice.questionId, questionId)));
  }
}

export async function addQuestion(testId: string, userId: string, afterQuestionId?: string | null) {
  await requireTestEditAccess(testId, userId);

  const questions = await db
    .select()
    .from(testQuestion)
    .where(eq(testQuestion.testId, testId))
    .orderBy(asc(testQuestion.position));

  const anchorPosition = afterQuestionId
    ? (questions.find((item) => item.id === afterQuestionId)?.position ?? questions.length - 1) + 1
    : questions.length;

  const questionId = createId();
  await db.transaction(async (tx) => {
    await shiftQuestionPositions(tx, testId, anchorPosition);

    await tx.insert(testQuestion).values({
      id: questionId,
      testId,
      position: anchorPosition,
      prompt: "Untitled question",
      description: "",
      required: true,
      type: "multiple_choice",
    });

    for (const [index, label] of ["Option A", "Option B"].entries()) {
      await tx.insert(questionChoice).values({
        id: createId(),
        questionId,
        position: index,
        label,
      });
    }

    await tx.update(test).set({ updatedAt: new Date() }).where(eq(test.id, testId));
  });
}

export async function updateQuestion(
  questionId: string,
  userId: string,
  values: { prompt?: string; description?: string | null; required?: boolean },
) {
  const question = await db.query.testQuestion.findFirst({
    where: eq(testQuestion.id, questionId),
  });
  const resolvedQuestion = assertPresent(question, "Question not found");

  await requireTestEditAccess(resolvedQuestion.testId, userId);

  await db
    .update(testQuestion)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(eq(testQuestion.id, questionId));
}

export async function reorderQuestions(testId: string, userId: string, questionIds: Array<string>) {
  await requireTestEditAccess(testId, userId);

  await db.transaction(async (tx) => {
    await applyQuestionOrder(tx, testId, questionIds);
    await tx.update(test).set({ updatedAt: new Date() }).where(eq(test.id, testId));
  });
}

export async function addChoice(questionId: string, userId: string, afterChoiceId?: string | null) {
  const question = await db.query.testQuestion.findFirst({
    where: eq(testQuestion.id, questionId),
  });
  const resolvedQuestion = assertPresent(question, "Question not found");

  await requireTestEditAccess(resolvedQuestion.testId, userId);

  const choices = await db
    .select()
    .from(questionChoice)
    .where(eq(questionChoice.questionId, questionId))
    .orderBy(asc(questionChoice.position));

  const anchorPosition = afterChoiceId
    ? (choices.find((item) => item.id === afterChoiceId)?.position ?? choices.length - 1) + 1
    : choices.length;

  await db.transaction(async (tx) => {
    await shiftChoicePositions(tx, questionId, anchorPosition);

    await tx.insert(questionChoice).values({
      id: createId(),
      questionId,
      position: anchorPosition,
      label: "New option",
    });

    await tx
      .update(test)
      .set({ updatedAt: new Date() })
      .where(eq(test.id, resolvedQuestion.testId));
  });
}

export async function updateChoice(choiceId: string, userId: string, label: string) {
  const choice = await db.query.questionChoice.findFirst({
    where: eq(questionChoice.id, choiceId),
  });
  const resolvedChoice = assertPresent(choice, "Choice not found");
  const question = await db.query.testQuestion.findFirst({
    where: eq(testQuestion.id, resolvedChoice.questionId),
  });
  const resolvedQuestion = assertPresent(question, "Question not found");

  await requireTestEditAccess(resolvedQuestion.testId, userId);

  await db
    .update(questionChoice)
    .set({
      label,
      updatedAt: new Date(),
    })
    .where(eq(questionChoice.id, choiceId));
}

export async function reorderChoices(questionId: string, userId: string, choiceIds: Array<string>) {
  const question = await db.query.testQuestion.findFirst({
    where: eq(testQuestion.id, questionId),
  });
  const resolvedQuestion = assertPresent(question, "Question not found");

  await requireTestEditAccess(resolvedQuestion.testId, userId);

  await db.transaction(async (tx) => {
    await applyChoiceOrder(tx, questionId, choiceIds);
    await tx
      .update(test)
      .set({ updatedAt: new Date() })
      .where(eq(test.id, resolvedQuestion.testId));
  });
}

export async function deleteQuestion(questionId: string, userId: string) {
  const question = await db.query.testQuestion.findFirst({
    where: eq(testQuestion.id, questionId),
  });
  const resolvedQuestion = assertPresent(question, "Question not found");

  await requireTestEditAccess(resolvedQuestion.testId, userId);

  await db.delete(testQuestion).where(eq(testQuestion.id, questionId));

  const remaining = await db
    .select()
    .from(testQuestion)
    .where(eq(testQuestion.testId, resolvedQuestion.testId))
    .orderBy(asc(testQuestion.position));

  for (const [index, item] of remaining.entries()) {
    await db
      .update(testQuestion)
      .set({ position: index, updatedAt: new Date() })
      .where(eq(testQuestion.id, item.id));
  }
}

export async function deleteChoice(choiceId: string, userId: string) {
  const choice = await db.query.questionChoice.findFirst({
    where: eq(questionChoice.id, choiceId),
  });
  const resolvedChoice = assertPresent(choice, "Choice not found");
  const question = await db.query.testQuestion.findFirst({
    where: eq(testQuestion.id, resolvedChoice.questionId),
  });
  const resolvedQuestion = assertPresent(question, "Question not found");

  await requireTestEditAccess(resolvedQuestion.testId, userId);

  const existingChoices = await db
    .select()
    .from(questionChoice)
    .where(eq(questionChoice.questionId, resolvedQuestion.id));

  if (existingChoices.length <= 2) {
    throw new Error("Each question must keep at least two choices");
  }

  await db.delete(questionChoice).where(eq(questionChoice.id, choiceId));

  const remaining = await db
    .select()
    .from(questionChoice)
    .where(eq(questionChoice.questionId, resolvedQuestion.id))
    .orderBy(asc(questionChoice.position));

  for (const [index, item] of remaining.entries()) {
    await db
      .update(questionChoice)
      .set({ position: index, updatedAt: new Date() })
      .where(eq(questionChoice.id, item.id));
  }
}

export async function publishTest(testId: string, userId: string) {
  const permission = await requireTestEditAccess(testId, userId);

  if (permission !== "owner") {
    throw new Error("Only owners can publish tests");
  }

  const questions = await db.select().from(testQuestion).where(eq(testQuestion.testId, testId));

  if (questions.length === 0) {
    throw new Error("Add at least one question before publishing");
  }

  await db
    .update(test)
    .set({
      status: "published",
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(test.id, testId));
}

export async function addEditor(testId: string, ownerUserId: string, email: string) {
  const permission = await requireTestEditAccess(testId, ownerUserId);

  if (permission !== "owner") {
    throw new Error("Only owners can add editors");
  }

  const invitedUser = await db.query.user.findFirst({
    where: eq(user.email, email),
  });

  if (!invitedUser) {
    throw new Error("No registered user exists with that email");
  }

  const existingMembership = await db.query.testUser.findFirst({
    where: and(eq(testUser.testId, testId), eq(testUser.userId, invitedUser.id)),
  });

  if (existingMembership?.role === "owner") {
    throw new Error("The owner already has access");
  }

  if (existingMembership?.role === "editor") {
    return;
  }

  if (existingMembership) {
    await db
      .update(testUser)
      .set({
        role: "editor",
        grantedByUserId: ownerUserId,
      })
      .where(and(eq(testUser.testId, testId), eq(testUser.userId, invitedUser.id)));

    return;
  }

  await db.insert(testUser).values({
    testId,
    userId: invitedUser.id,
    role: "editor",
    grantedByUserId: ownerUserId,
  });
}

export async function removeEditor(testId: string, ownerUserId: string, targetUserId: string) {
  const permission = await requireTestEditAccess(testId, ownerUserId);

  if (permission !== "owner") {
    throw new Error("Only owners can remove editors");
  }

  await db
    .delete(testUser)
    .where(
      and(
        eq(testUser.testId, testId),
        eq(testUser.userId, targetUserId),
        eq(testUser.role, "editor"),
      ),
    );
}

async function getOrCreateResponse(testId: string, userId: string) {
  const existing = await db.query.testResponse.findFirst({
    where: and(eq(testResponse.testId, testId), eq(testResponse.userId, userId)),
  });

  if (existing) {
    return existing;
  }

  const [created] = await db
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

  return assertPresent(created, "Failed to create response");
}

export async function saveAnswer(
  testId: string,
  userId: string,
  questionId: string,
  choiceId: string,
) {
  const permission = await requireTestViewAccess(testId, userId);

  if (permission === "owner" || permission === "editor") {
    const currentTest = await db.query.test.findFirst({
      where: eq(test.id, testId),
    });

    if (currentTest?.status !== "published") {
      throw new Error("Only published tests can collect responses");
    }
  }

  const question = await db.query.testQuestion.findFirst({
    where: and(eq(testQuestion.id, questionId), eq(testQuestion.testId, testId)),
  });
  assertPresent(question, "Question not found");

  const choice = await db.query.questionChoice.findFirst({
    where: and(eq(questionChoice.id, choiceId), eq(questionChoice.questionId, questionId)),
  });
  assertPresent(choice, "Choice does not belong to question");

  const response = await getOrCreateResponse(testId, userId);

  if (response.status === "submitted") {
    throw new Error("Response already submitted");
  }

  const existingAnswer = await db.query.responseAnswer.findFirst({
    where: and(
      eq(responseAnswer.responseId, response.id),
      eq(responseAnswer.questionId, questionId),
    ),
  });

  if (existingAnswer) {
    await db
      .update(responseAnswer)
      .set({
        choiceId,
        updatedAt: new Date(),
      })
      .where(eq(responseAnswer.id, existingAnswer.id));
  } else {
    await db.insert(responseAnswer).values({
      id: createId(),
      responseId: response.id,
      questionId,
      choiceId,
    });
  }

  const [updatedResponse] = await db
    .update(testResponse)
    .set({
      lastAutosavedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(testResponse.id, response.id))
    .returning();

  return assertPresent(updatedResponse, "Response not found");
}

export async function submitResponse(testId: string, userId: string) {
  const permission = await requireTestViewAccess(testId, userId);

  if (!permission) {
    throw new Error("Forbidden");
  }

  const currentTest = await db.query.test.findFirst({
    where: eq(test.id, testId),
  });
  const resolvedTest = assertPresent(currentTest, "Test not found");

  if (resolvedTest.status !== "published") {
    throw new Error("Only published tests can be submitted");
  }

  const questions = await getQuestions(testId);
  const response = await getOrCreateResponse(testId, userId);

  if (response.status === "submitted") {
    return response;
  }

  const answers = await db
    .select()
    .from(responseAnswer)
    .where(eq(responseAnswer.responseId, response.id));

  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer.choiceId]));
  const missingRequired = questions.some(
    (question) => question.required && !answerMap.has(question.id),
  );

  if (missingRequired) {
    throw new Error("Complete all required questions before submitting");
  }

  const [submitted] = await db
    .update(testResponse)
    .set({
      status: "submitted",
      submittedAt: new Date(),
      lastAutosavedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(testResponse.id, response.id))
    .returning();

  return assertPresent(submitted, "Response not found");
}

export async function getResponsesTable(
  testId: string,
  userId: string,
  search: {
    page: number;
    query: string;
    status: "all" | "draft" | "submitted";
    sortBy: "startedAt" | "submittedAt";
    direction: "asc" | "desc";
  },
) {
  await requireResponseReviewAccess(testId, userId);

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

  const rows = await db
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
}

export async function getResponseReview(testId: string, responseId: string, userId: string) {
  const permission = await requireResponseReviewAccess(testId, userId);
  const currentTest = await db.query.test.findFirst({
    where: eq(test.id, testId),
  });
  const resolvedTest = assertPresent(currentTest, "Test not found");
  const owner = await getOwnerProfile(resolvedTest.id);
  const currentResponse = await db.query.testResponse.findFirst({
    where: and(eq(testResponse.id, responseId), eq(testResponse.testId, testId)),
  });
  const resolvedResponse = assertPresent(currentResponse, "Response not found");
  const responder = await db.query.user.findFirst({
    where: eq(user.id, resolvedResponse.userId),
  });
  const answers = await db
    .select()
    .from(responseAnswer)
    .where(eq(responseAnswer.responseId, resolvedResponse.id));

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
    questions: await getQuestions(testId),
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
}
