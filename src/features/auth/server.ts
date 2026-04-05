import { redirect } from "@tanstack/react-router";

import { currentSessionEffect, currentUserEffect } from "@/server/runtime/request-context";
import { runRouteLoaderEffect } from "@/server/runtime/route-loader";
import { runServerEffect } from "@/server/runtime/run-server-effect";

export type { SessionData, SessionUser } from "@/domains/auth/model";

export const getServerSessionEffect = currentSessionEffect;

export const requireUserEffect = currentUserEffect;

export async function getServerSession() {
  return await runServerEffect(getServerSessionEffect, {
    name: "auth.getServerSession",
  });
}

export async function requireUser() {
  return await runServerEffect(requireUserEffect, {
    name: "auth.requireUser",
  });
}

export async function requireRouteUser() {
  try {
    return await runRouteLoaderEffect(requireUserEffect);
  } catch (error) {
    if (error && typeof error === "object" && "status" in error && error.status === 401) {
      throw redirect({
        to: "/auth",
      });
    }

    if (error && typeof error === "object" && "to" in error) {
      throw error;
    }

    throw redirect({
      to: "/auth",
    });
  }
}
