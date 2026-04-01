import { Effect } from "effect";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";
import { runServerEffect, tryServerPromise } from "@/backend/effect";
import { UnauthorizedError } from "@/backend/errors";
import { auth } from "@/lib/auth";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
};

export type SessionData = {
  user: SessionUser;
};

export const getServerSessionEffect = tryServerPromise("Failed to load session", () =>
  auth.api.getSession({
    headers: getRequestHeaders(),
  }),
).pipe(
  Effect.map((session) => {
    if (!session?.user) {
      return null;
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image ?? null,
      },
    } satisfies SessionData;
  }),
);

export const requireUserEffect = getServerSessionEffect.pipe(
  Effect.flatMap((session) =>
    session?.user
      ? Effect.succeed(session.user)
      : Effect.fail(new UnauthorizedError({ message: "Unauthorized" })),
  ),
);

export async function getServerSession() {
  return await runServerEffect(getServerSessionEffect);
}

export async function requireUser() {
  return await runServerEffect(requireUserEffect);
}

export async function requireRouteUser() {
  const session = await getServerSession();

  if (!session?.user) {
    throw redirect({
      to: "/auth",
    });
  }

  return session.user;
}
