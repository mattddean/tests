import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ForbiddenError, InvalidStateError } from "@/backend/errors";
import { runServerEffect } from "@/backend/effect";
import { DB } from "@/db/effect";
import { test, testEmailAccess, user as userTable } from "@/db/schema";
import { env } from "@/env";
import { requireUserEffect } from "@/features/auth/server";
import { createId } from "@/features/common/ids";
import { assertPresent } from "@/lib/assert-present";
import { sendTestInvitationEmailEffect } from "@/lib/agentmail";
import { requireTestEditAccess } from "../data";

const shareTestInputSchema = z.object({
  testId: z.string(),
  email: z.email().transform((value) => value.toLowerCase()),
});
export type ShareTestInputSchema = z.infer<typeof shareTestInputSchema>;

export const shareTestAction = createServerFn({ method: "POST" })
  .inputValidator(shareTestInputSchema)
  .handler(({ data }) =>
    runServerEffect(
      Effect.gen(function* () {
        const user = yield* requireUserEffect;
        const db = yield* DB;
        const permission = yield* requireTestEditAccess(data.testId, user.id);

        if (permission !== "owner") {
          return yield* Effect.fail(
            new ForbiddenError({ message: "Only owners can share tests with takers" }),
          );
        }

        const [currentTest] = yield* db.select().from(test).where(eq(test.id, data.testId)).limit(1);
        const resolvedTest = assertPresent(currentTest, "Test not found");

        if (resolvedTest.status !== "published") {
          return yield* Effect.fail(
            new InvalidStateError({ message: "Publish the test before inviting takers" }),
          );
        }

        const [owner] = yield* db.select().from(userTable).where(eq(userTable.id, user.id)).limit(1);
        const resolvedOwner = assertPresent(owner, "Owner not found");
        const now = new Date();
        const [existingInvite] = yield* db
          .select()
          .from(testEmailAccess)
          .where(
            and(
              eq(testEmailAccess.testId, data.testId),
              eq(testEmailAccess.email, data.email),
              eq(testEmailAccess.role, "taker"),
            ),
          )
          .limit(1);

        if (existingInvite) {
          yield* db
            .update(testEmailAccess)
            .set({
              grantedByUserId: user.id,
              lastSentAt: now,
              updatedAt: now,
            })
            .where(eq(testEmailAccess.id, existingInvite.id));
        } else {
          yield* db.insert(testEmailAccess).values({
            id: createId(),
            testId: data.testId,
            email: data.email,
            role: "taker",
            grantedByUserId: user.id,
            lastSentAt: now,
          });
        }

        yield* sendTestInvitationEmailEffect({
          to: data.email,
          ownerName: resolvedOwner.name ?? resolvedOwner.email,
          testTitle: resolvedTest.title,
          invitationUrl: getInvitationUrl(data.testId, data.email),
        });

        return { ok: true };
      }),
    ),
  );

function getInvitationUrl(testId: string, email: string) {
  return `${env.BETTER_AUTH_URL}/tests/${testId}?inviteEmail=${encodeURIComponent(email)}`;
}
