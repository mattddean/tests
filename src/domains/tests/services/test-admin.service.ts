import { and, eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { createId, createSlug } from "@/features/common/ids";
import { ServerConfig } from "@/server/config/server-config";
import { DB } from "@/server/db/live";
import type { Database } from "@/server/db/live";
import { test, testEmailAccess, testQuestion, testUser, user } from "@/server/db/schema";
import { Mailer } from "@/server/mail/mailer";
import {
  CannotPublishEmptyTest,
  ForbiddenTestAccess,
  OnlyOwnerCanManageEditors,
  OnlyOwnerCanPublish,
  OnlyOwnerCanShareWithTakers,
  OwnerAlreadyHasAccess,
  TestMustBePublished,
  TestNotFound,
  UserNotFound,
} from "../errors";
import type { TestPermission } from "../model";

type TestsDb = Omit<Database, "$client">;

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

function getCurrentTestRecord(db: TestsDb, testId: string) {
  return Effect.gen(function* () {
    const [currentTest] = yield* db.select().from(test).where(eq(test.id, testId)).limit(1);
    return yield* requirePresent(currentTest, new TestNotFound({ message: "Test not found" }));
  });
}

export type TestAdminServiceShape = {
  readonly createTestRecord: (userId: string, title: string) => Effect.Effect<{ id: string }, unknown>;
  readonly updateTestMeta: (
    testId: string,
    userId: string,
    values: { title: string; description: string | null },
  ) => Effect.Effect<void, unknown>;
  readonly publishTest: (testId: string, userId: string) => Effect.Effect<void, unknown>;
  readonly addEditor: (testId: string, ownerUserId: string, email: string) => Effect.Effect<void, unknown>;
  readonly removeEditor: (testId: string, ownerUserId: string, targetUserId: string) => Effect.Effect<void, unknown>;
  readonly shareTest: (testId: string, ownerUserId: string, email: string) => Effect.Effect<void, unknown>;
};

export class TestAdminService extends Context.Tag("TestAdminService")<TestAdminService, TestAdminServiceShape>() {}

export const TestAdminServiceLive = Layer.effect(
  TestAdminService,
  Effect.gen(function* () {
    const db = yield* DB;
    const mailer = yield* Mailer;
    const config = yield* ServerConfig;

    return {
      createTestRecord: (userId, title) =>
        Effect.gen(function* () {
          const id = createId();
          yield* db.insert(test).values({
            id,
            slug: createSlug(title),
            title,
            description: "",
            status: "draft",
          });

          yield* db.insert(testUser).values({
            testId: id,
            userId,
            role: "owner",
            grantedByUserId: userId,
          });

          return { id };
        }),
      updateTestMeta: (testId, userId, values) =>
        Effect.gen(function* () {
          yield* requireEditAccess(db, testId, userId);
          yield* db
            .update(test)
            .set({
              title: values.title,
              description: values.description,
              updatedAt: new Date(),
            })
            .where(eq(test.id, testId));
        }),
      publishTest: (testId, userId) =>
        Effect.gen(function* () {
          const permission = yield* requireEditAccess(db, testId, userId);
          if (permission !== "owner") {
            return yield* Effect.fail(new OnlyOwnerCanPublish({ message: "Only owners can publish tests" }));
          }

          const questions = yield* db.select().from(testQuestion).where(eq(testQuestion.testId, testId));
          if (questions.length === 0) {
            return yield* Effect.fail(new CannotPublishEmptyTest({ message: "Add at least one question before publishing" }));
          }

          yield* db
            .update(test)
            .set({
              status: "published",
              publishedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(test.id, testId));
        }),
      addEditor: (testId, ownerUserId, email) =>
        Effect.gen(function* () {
          const permission = yield* requireEditAccess(db, testId, ownerUserId);
          const normalizedEmail = normalizeEmail(email);

          if (permission !== "owner") {
            return yield* Effect.fail(new OnlyOwnerCanManageEditors({ message: "Only owners can add editors" }));
          }

          const [invitedUser] = yield* db.select().from(user).where(eq(user.email, normalizedEmail)).limit(1);
          if (!invitedUser) {
            return yield* Effect.fail(new UserNotFound({ message: "No registered user exists with that email" }));
          }

          const [existingMembership] = yield* db
            .select()
            .from(testUser)
            .where(and(eq(testUser.testId, testId), eq(testUser.userId, invitedUser.id)))
            .limit(1);

          if (existingMembership?.role === "owner") {
            return yield* Effect.fail(new OwnerAlreadyHasAccess({ message: "The owner already has access" }));
          }
          if (existingMembership?.role === "editor") {
            return;
          }
          if (existingMembership) {
            yield* db
              .update(testUser)
              .set({ role: "editor", grantedByUserId: ownerUserId })
              .where(and(eq(testUser.testId, testId), eq(testUser.userId, invitedUser.id)));
            return;
          }

          yield* db.insert(testUser).values({
            testId,
            userId: invitedUser.id,
            role: "editor",
            grantedByUserId: ownerUserId,
          });
        }),
      removeEditor: (testId, ownerUserId, targetUserId) =>
        Effect.gen(function* () {
          const permission = yield* requireEditAccess(db, testId, ownerUserId);
          if (permission !== "owner") {
            return yield* Effect.fail(new OnlyOwnerCanManageEditors({ message: "Only owners can remove editors" }));
          }

          yield* db
            .delete(testUser)
            .where(and(eq(testUser.testId, testId), eq(testUser.userId, targetUserId), eq(testUser.role, "editor")));
        }),
      shareTest: (testId, ownerUserId, email) =>
        Effect.gen(function* () {
          const permission = yield* requireEditAccess(db, testId, ownerUserId);
          const normalizedEmail = normalizeEmail(email);

          if (permission !== "owner") {
            return yield* Effect.fail(
              new OnlyOwnerCanShareWithTakers({ message: "Only owners can share tests with takers" }),
            );
          }

          const resolvedTest = yield* getCurrentTestRecord(db, testId);
          if (resolvedTest.status !== "published") {
            return yield* Effect.fail(new TestMustBePublished({ message: "Publish the test before inviting takers" }));
          }

          const [owner] = yield* db.select().from(user).where(eq(user.id, ownerUserId)).limit(1);
          const resolvedOwner = yield* requirePresent(owner, new UserNotFound({ message: "Owner not found" }));

          const now = new Date();
          const [existingInvite] = yield* db
            .select()
            .from(testEmailAccess)
            .where(
              and(
                eq(testEmailAccess.testId, testId),
                eq(testEmailAccess.email, normalizedEmail),
                eq(testEmailAccess.role, "taker"),
              ),
            )
            .limit(1);

          if (existingInvite) {
            yield* db
              .update(testEmailAccess)
              .set({
                grantedByUserId: ownerUserId,
                lastSentAt: now,
                updatedAt: now,
              })
              .where(eq(testEmailAccess.id, existingInvite.id));
          } else {
            yield* db.insert(testEmailAccess).values({
              id: createId(),
              testId,
              email: normalizedEmail,
              role: "taker",
              grantedByUserId: ownerUserId,
              lastSentAt: now,
            });
          }

          yield* mailer.sendTestInvitation({
            to: normalizedEmail,
            ownerName: resolvedOwner.name ?? resolvedOwner.email,
            testTitle: resolvedTest.title,
            invitationUrl: `${config.BETTER_AUTH_URL}/tests/${testId}?inviteEmail=${encodeURIComponent(normalizedEmail)}`,
          });
        }),
    };
  }),
);
