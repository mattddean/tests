import { getRequestHeaders } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";
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

export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: getRequestHeaders(),
  });

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
}

export async function requireUser() {
  const session = await getServerSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return session.user;
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
