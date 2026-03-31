import { and, eq } from "drizzle-orm";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/db";
import { test, testEmailAccess, user as userTable } from "@/db/schema";
import { env } from "@/env";
import { requireUser } from "@/features/auth/server";
import { createId } from "@/features/common/ids";
import { assertPresent } from "@/lib/assert-present";
import { sendTestInvitationEmail } from "@/lib/agentmail";
import { requireTestEditAccess } from "../data";

const shareTestInputSchema = z.object({
  testId: z.string(),
  email: z.email().transform((value) => value.toLowerCase()),
});
export type ShareTestInputSchema = z.infer<typeof shareTestInputSchema>;

export const shareTestAction = createServerFn({ method: "POST" })
  .inputValidator(shareTestInputSchema)
  .handler(async ({ data }) => {
    const user = await requireUser();
    const permission = await requireTestEditAccess(data.testId, user.id);

    if (permission !== "owner") {
      throw new Error("Only owners can share tests with takers");
    }

    const currentTest = await db.query.test.findFirst({
      where: eq(test.id, data.testId),
    });
    const resolvedTest = assertPresent(currentTest, "Test not found");

    if (resolvedTest.status !== "published") {
      throw new Error("Publish the test before inviting takers");
    }

    const owner = await db.query.user.findFirst({
      where: eq(userTable.id, user.id),
    });
    const resolvedOwner = assertPresent(owner, "Owner not found");
    const now = new Date();
    const existingInvite = await db.query.testEmailAccess.findFirst({
      where: and(
        eq(testEmailAccess.testId, data.testId),
        eq(testEmailAccess.email, data.email),
        eq(testEmailAccess.role, "taker"),
      ),
    });

    if (existingInvite) {
      await db
        .update(testEmailAccess)
        .set({
          grantedByUserId: user.id,
          lastSentAt: now,
          updatedAt: now,
        })
        .where(eq(testEmailAccess.id, existingInvite.id));
    } else {
      await db.insert(testEmailAccess).values({
        id: createId(),
        testId: data.testId,
        email: data.email,
        role: "taker",
        grantedByUserId: user.id,
        lastSentAt: now,
      });
    }

    await sendTestInvitationEmail({
      to: data.email,
      ownerName: resolvedOwner.name ?? resolvedOwner.email,
      testTitle: resolvedTest.title,
      invitationUrl: getInvitationUrl(data.testId, data.email),
    });

    return { ok: true };
  });

function getInvitationUrl(testId: string, email: string) {
  return `${env.BETTER_AUTH_URL}/tests/${testId}?inviteEmail=${encodeURIComponent(email)}`;
}
