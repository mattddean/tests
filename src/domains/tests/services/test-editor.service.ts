import { and, asc, eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";

import type { Database } from "@/server/db/live";

import { createId } from "@/features/common/ids";
import { DB } from "@/server/db/live";
import { questionChoice, test, testQuestion, testUser } from "@/server/db/schema";

import type { TestPermission } from "../model";

import {
  AtLeastTwoChoicesRequired,
  ChoiceNotFound,
  ForbiddenTestAccess,
  QuestionNotFound,
} from "../errors";

type TestsDb = Omit<Database, "$client">;

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

function getQuestionById(db: TestsDb, questionId: string) {
  return db
    .select({ id: testQuestion.id, testId: testQuestion.testId })
    .from(testQuestion)
    .where(eq(testQuestion.id, questionId))
    .limit(1)
    .pipe(Effect.map(([question]) => question ?? null));
}

function getChoiceById(db: TestsDb, choiceId: string) {
  return db
    .select({ id: questionChoice.id, questionId: questionChoice.questionId })
    .from(questionChoice)
    .where(eq(questionChoice.id, choiceId))
    .limit(1)
    .pipe(Effect.map(([choice]) => choice ?? null));
}

function requireQuestionEditAccess(db: TestsDb, questionId: string, userId: string) {
  return Effect.gen(function* () {
    const question = yield* getQuestionById(db, questionId);
    const resolvedQuestion = yield* requirePresent(
      question,
      new QuestionNotFound({ message: "Question not found" }),
    );
    yield* requireEditAccess(db, resolvedQuestion.testId, userId);
    return resolvedQuestion;
  });
}

function requireChoiceEditAccess(db: TestsDb, choiceId: string, userId: string) {
  return Effect.gen(function* () {
    const choice = yield* getChoiceById(db, choiceId);
    const resolvedChoice = yield* requirePresent(
      choice,
      new ChoiceNotFound({ message: "Choice not found" }),
    );
    const question = yield* getQuestionById(db, resolvedChoice.questionId);
    const resolvedQuestion = yield* requirePresent(
      question,
      new QuestionNotFound({ message: "Question not found" }),
    );
    yield* requireEditAccess(db, resolvedQuestion.testId, userId);
    return { choice: resolvedChoice, question: resolvedQuestion };
  });
}

function shiftQuestionPositions(client: TestsDb, testId: string, fromPosition: number) {
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
        .set({ position: item.position + 1, updatedAt: new Date() })
        .where(eq(testQuestion.id, item.id));
    }
  });
}

function shiftChoicePositions(client: TestsDb, questionId: string, fromPosition: number) {
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
        .set({ position: item.position + 1, updatedAt: new Date() })
        .where(eq(questionChoice.id, item.id));
    }
  });
}

function applyQuestionOrder(client: TestsDb, testId: string, questionIds: Array<string>) {
  return Effect.gen(function* () {
    for (const [index, questionId] of questionIds.entries()) {
      yield* client
        .update(testQuestion)
        .set({ position: questionIds.length + index, updatedAt: new Date() })
        .where(and(eq(testQuestion.id, questionId), eq(testQuestion.testId, testId)));
    }
    for (const [index, questionId] of questionIds.entries()) {
      yield* client
        .update(testQuestion)
        .set({ position: index, updatedAt: new Date() })
        .where(and(eq(testQuestion.id, questionId), eq(testQuestion.testId, testId)));
    }
  });
}

function applyChoiceOrder(client: TestsDb, questionId: string, choiceIds: Array<string>) {
  return Effect.gen(function* () {
    for (const [index, choiceId] of choiceIds.entries()) {
      yield* client
        .update(questionChoice)
        .set({ position: choiceIds.length + index, updatedAt: new Date() })
        .where(and(eq(questionChoice.id, choiceId), eq(questionChoice.questionId, questionId)));
    }
    for (const [index, choiceId] of choiceIds.entries()) {
      yield* client
        .update(questionChoice)
        .set({ position: index, updatedAt: new Date() })
        .where(and(eq(questionChoice.id, choiceId), eq(questionChoice.questionId, questionId)));
    }
  });
}

function deleteChoiceRecord(db: TestsDb, choiceId: string) {
  return Effect.gen(function* () {
    const [choice] = yield* db
      .select()
      .from(questionChoice)
      .where(eq(questionChoice.id, choiceId))
      .limit(1);
    const resolvedChoice = yield* requirePresent(
      choice,
      new ChoiceNotFound({ message: "Choice not found" }),
    );
    const [question] = yield* db
      .select()
      .from(testQuestion)
      .where(eq(testQuestion.id, resolvedChoice.questionId))
      .limit(1);
    const resolvedQuestion = yield* requirePresent(
      question,
      new QuestionNotFound({ message: "Question not found" }),
    );

    const existingChoices = yield* db
      .select()
      .from(questionChoice)
      .where(eq(questionChoice.questionId, resolvedQuestion.id));
    if (existingChoices.length <= 2) {
      return yield* Effect.fail(
        new AtLeastTwoChoicesRequired({ message: "Each question must keep at least two choices" }),
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
}

export type TestEditorServiceShape = {
  readonly addQuestion: (
    testId: string,
    userId: string,
    afterQuestionId?: string | null,
  ) => Effect.Effect<void, unknown>;
  readonly updateQuestion: (
    questionId: string,
    userId: string,
    values: { prompt?: string; description?: string | null; required?: boolean },
  ) => Effect.Effect<void, unknown>;
  readonly reorderQuestions: (
    testId: string,
    userId: string,
    questionIds: Array<string>,
  ) => Effect.Effect<void, unknown>;
  readonly addChoice: (
    questionId: string,
    userId: string,
    afterChoiceId?: string | null,
  ) => Effect.Effect<void, unknown>;
  readonly updateChoice: (
    choiceId: string,
    userId: string,
    label: string,
  ) => Effect.Effect<void, unknown>;
  readonly reorderChoices: (
    questionId: string,
    userId: string,
    choiceIds: Array<string>,
  ) => Effect.Effect<void, unknown>;
  readonly deleteQuestion: (questionId: string, userId: string) => Effect.Effect<void, unknown>;
  readonly deleteChoice: (choiceId: string, userId: string) => Effect.Effect<void, unknown>;
};

export class TestEditorService extends Context.Tag("TestEditorService")<
  TestEditorService,
  TestEditorServiceShape
>() {}

export const TestEditorServiceLive = Layer.effect(
  TestEditorService,
  Effect.gen(function* () {
    const db = yield* DB;

    return {
      addQuestion: (testId, userId, afterQuestionId) =>
        Effect.gen(function* () {
          yield* requireEditAccess(db, testId, userId);
          const questions = yield* db
            .select()
            .from(testQuestion)
            .where(eq(testQuestion.testId, testId))
            .orderBy(asc(testQuestion.position));
          const anchorPosition = afterQuestionId
            ? (questions.find((item) => item.id === afterQuestionId)?.position ??
                questions.length - 1) + 1
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
                yield* tx
                  .insert(questionChoice)
                  .values({ id: createId(), questionId, position: index, label });
              }
              yield* tx.update(test).set({ updatedAt: new Date() }).where(eq(test.id, testId));
            }),
          );
        }),
      updateQuestion: (questionId, userId, values) =>
        Effect.gen(function* () {
          yield* requireQuestionEditAccess(db, questionId, userId);
          yield* db
            .update(testQuestion)
            .set({ ...values, updatedAt: new Date() })
            .where(eq(testQuestion.id, questionId));
        }),
      reorderQuestions: (testId, userId, questionIds) =>
        Effect.gen(function* () {
          yield* requireEditAccess(db, testId, userId);
          yield* db.transaction((tx) =>
            Effect.gen(function* () {
              yield* applyQuestionOrder(tx, testId, questionIds);
              yield* tx.update(test).set({ updatedAt: new Date() }).where(eq(test.id, testId));
            }),
          );
        }),
      addChoice: (questionId, userId, afterChoiceId) =>
        Effect.gen(function* () {
          const resolvedQuestion = yield* requireQuestionEditAccess(db, questionId, userId);
          const choices = yield* db
            .select()
            .from(questionChoice)
            .where(eq(questionChoice.questionId, questionId))
            .orderBy(asc(questionChoice.position));
          const anchorPosition = afterChoiceId
            ? (choices.find((item) => item.id === afterChoiceId)?.position ?? choices.length - 1) +
              1
            : choices.length;
          yield* db.transaction((tx) =>
            Effect.gen(function* () {
              yield* shiftChoicePositions(tx, questionId, anchorPosition);
              yield* tx
                .insert(questionChoice)
                .values({
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
        }),
      updateChoice: (choiceId, userId, label) =>
        Effect.gen(function* () {
          yield* requireChoiceEditAccess(db, choiceId, userId);
          yield* db
            .update(questionChoice)
            .set({ label, updatedAt: new Date() })
            .where(eq(questionChoice.id, choiceId));
        }),
      reorderChoices: (questionId, userId, choiceIds) =>
        Effect.gen(function* () {
          const resolvedQuestion = yield* requireQuestionEditAccess(db, questionId, userId);
          yield* db.transaction((tx) =>
            Effect.gen(function* () {
              yield* applyChoiceOrder(tx, questionId, choiceIds);
              yield* tx
                .update(test)
                .set({ updatedAt: new Date() })
                .where(eq(test.id, resolvedQuestion.testId));
            }),
          );
        }),
      deleteQuestion: (questionId, userId) =>
        Effect.gen(function* () {
          const resolvedQuestion = yield* requireQuestionEditAccess(db, questionId, userId);
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
        }),
      deleteChoice: (choiceId, userId) =>
        Effect.gen(function* () {
          yield* requireChoiceEditAccess(db, choiceId, userId);
          yield* deleteChoiceRecord(db, choiceId);
        }),
    };
  }),
);
