import { and, asc, eq, inArray } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { createId } from "@/features/common/ids";
import { DB } from "@/server/db/live";
import type { Database } from "@/server/db/live";
import { questionChoice, responseAnswer, test, testQuestion, testResponse, testUser } from "@/server/db/schema";
import {
  ChoiceNotFound,
  ForbiddenTestAccess,
  QuestionNotFound,
  RequiredQuestionsIncomplete,
  ResponseAlreadySubmitted,
  ResponseNotFound,
  TestMustBePublished,
  TestNotFound,
} from "../errors";
import type { QuestionView } from "../dto";
import type { TestPermission } from "../model";

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

function requireViewAccess(db: TestsDb, testId: string, userId: string) {
  return Effect.gen(function* () {
    const permission = yield* getTestPermission(db, testId, userId);
    if (!permission) {
      return yield* Effect.fail(new ForbiddenTestAccess({ message: "Forbidden" }));
    }
    return permission;
  });
}

function getCurrentTestRecord(db: TestsDb, testId: string) {
  return Effect.gen(function* () {
    const [currentTest] = yield* db.select().from(test).where(eq(test.id, testId)).limit(1);
    return yield* requirePresent(currentTest, new TestNotFound({ message: "Test not found" }));
  });
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
      choices: choices.filter((choice) => choice.questionId === item.id).map((choice) => ({
        id: choice.id,
        position: choice.position,
        label: choice.label,
      })),
    })) satisfies Array<QuestionView>;
  });
}

function getOrCreateResponse(db: TestsDb, testId: string, userId: string) {
  return Effect.gen(function* () {
    const [existing] = yield* db.select().from(testResponse).where(and(eq(testResponse.testId, testId), eq(testResponse.userId, userId))).limit(1);
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

    return yield* requirePresent(created, new ResponseNotFound({ message: "Failed to create response" }));
  });
}

function saveAnswerRecord(db: TestsDb, testId: string, userId: string, questionId: string, choiceId: string) {
  return Effect.gen(function* () {
    const [question] = yield* db.select().from(testQuestion).where(and(eq(testQuestion.id, questionId), eq(testQuestion.testId, testId))).limit(1);
    yield* requirePresent(question, new QuestionNotFound({ message: "Question not found" }));

    const [choice] = yield* db.select().from(questionChoice).where(and(eq(questionChoice.id, choiceId), eq(questionChoice.questionId, questionId))).limit(1);
    yield* requirePresent(choice, new ChoiceNotFound({ message: "Choice does not belong to question" }));

    const response = yield* getOrCreateResponse(db, testId, userId);
    if (response.status === "submitted") {
      return yield* Effect.fail(new ResponseAlreadySubmitted({ message: "Response already submitted" }));
    }

    const [existingAnswer] = yield* db
      .select()
      .from(responseAnswer)
      .where(and(eq(responseAnswer.responseId, response.id), eq(responseAnswer.questionId, questionId)))
      .limit(1);

    if (existingAnswer) {
      yield* db.update(responseAnswer).set({ choiceId, updatedAt: new Date() }).where(eq(responseAnswer.id, existingAnswer.id));
    } else {
      yield* db.insert(responseAnswer).values({ id: createId(), responseId: response.id, questionId, choiceId });
    }

    const [updatedResponse] = yield* db
      .update(testResponse)
      .set({ lastAutosavedAt: new Date(), updatedAt: new Date() })
      .where(eq(testResponse.id, response.id))
      .returning();

    return yield* requirePresent(updatedResponse, new ResponseNotFound({ message: "Response not found" }));
  });
}

export type TestTakingServiceShape = {
  readonly saveAnswer: (testId: string, userId: string, questionId: string, choiceId: string) => Effect.Effect<unknown, unknown>;
  readonly submitResponse: (testId: string, userId: string) => Effect.Effect<unknown, unknown>;
};

export class TestTakingService extends Context.Tag("TestTakingService")<TestTakingService, TestTakingServiceShape>() {}

export const TestTakingServiceLive = Layer.effect(
  TestTakingService,
  Effect.gen(function* () {
    const db = yield* DB;

    return {
      saveAnswer: (testId, userId, questionId, choiceId) =>
        Effect.gen(function* () {
          const permission = yield* requireViewAccess(db, testId, userId);
          if (permission === "owner" || permission === "editor") {
            const currentTest = yield* getCurrentTestRecord(db, testId);
            if (currentTest.status !== "published") {
              return yield* Effect.fail(new TestMustBePublished({ message: "Only published tests can collect responses" }));
            }
          }
          return yield* saveAnswerRecord(db, testId, userId, questionId, choiceId);
        }),
      submitResponse: (testId, userId) =>
        Effect.gen(function* () {
          yield* requireViewAccess(db, testId, userId);
          const resolvedTest = yield* getCurrentTestRecord(db, testId);
          if (resolvedTest.status !== "published") {
            return yield* Effect.fail(new TestMustBePublished({ message: "Only published tests can be submitted" }));
          }

          const questions = yield* getQuestions(db, testId);
          const response = yield* getOrCreateResponse(db, testId, userId);
          if (response.status === "submitted") {
            return response;
          }

          const answers = yield* db.select().from(responseAnswer).where(eq(responseAnswer.responseId, response.id));
          const answerMap = new Map(answers.map((answer) => [answer.questionId, answer.choiceId]));
          const missingRequired = questions.some((question) => question.required && !answerMap.has(question.id));
          if (missingRequired) {
            return yield* Effect.fail(
              new RequiredQuestionsIncomplete({ message: "Complete all required questions before submitting" }),
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

          return submitted ?? response;
        }),
    };
  }),
);
