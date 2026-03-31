import { createHash, randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/db";
import { test, testTakerInvite, user as userTable } from "@/db/schema";
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
    const token = createInviteToken();
    const tokenHash = hashInviteToken(token);
    const now = new Date();
    const existingInvite = await db.query.testTakerInvite.findFirst({
      where: and(eq(testTakerInvite.testId, data.testId), eq(testTakerInvite.email, data.email)),
    });

    if (existingInvite) {
      await db
        .update(testTakerInvite)
        .set({
          tokenHash,
          invitedByUserId: user.id,
          lastSentAt: now,
          updatedAt: now,
        })
        .where(eq(testTakerInvite.id, existingInvite.id));
    } else {
      await db.insert(testTakerInvite).values({
        id: createId(),
        testId: data.testId,
        email: data.email,
        tokenHash,
        invitedByUserId: user.id,
        lastSentAt: now,
      });
    }

    await sendTestInvitationEmail({
      to: data.email,
      ownerName: resolvedOwner.name ?? resolvedOwner.email,
      testTitle: resolvedTest.title,
      invitationUrl: getInvitationUrl(token),
    });

    return { ok: true };
  });

const testInviteTokenInputSchema = z.object({
  token: z.string().min(1),
});
export type TestInviteTokenInputSchema = z.infer<typeof shareTestInputSchema>;

export const acceptTestInviteAction = createServerFn({ method: "GET" })
  .inputValidator(testInviteTokenInputSchema)
  .handler(async ({ data }) => {
    const user = await requireUser();
    const invite = await db.query.testTakerInvite.findFirst({
      where: eq(testTakerInvite.tokenHash, hashInviteToken(data.token)),
    });
    const resolvedInvite = assertPresent(invite, "Invitation not found");

    if (user.email !== resolvedInvite.email) {
      throw new Error(`Sign in with ${resolvedInvite.email} to accept this invitation.`);
    }

    const currentTest = await db.query.test.findFirst({
      where: eq(test.id, resolvedInvite.testId),
    });
    const resolvedTest = assertPresent(currentTest, "Test not found");

    if (resolvedTest.status !== "published") {
      throw new Error("This test has not been published yet.");
    }

    await db
      .update(testTakerInvite)
      .set({
        acceptedByUserId: user.id,
        acceptedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(testTakerInvite.id, resolvedInvite.id));

    return {
      testId: resolvedTest.id,
    };
  });

function createInviteToken() {
  return randomBytes(24).toString("base64url");
}

function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getInvitationUrl(token: string) {
  return `${env.BETTER_AUTH_URL}/invitations/${token}`;
}
