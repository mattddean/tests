import { redirect } from "@tanstack/react-router";

import { unwrapServerResult } from "@/lib/server-result";
import { currentSessionEffect, currentUserEffect } from "@/server/runtime/request-context";
import { runRouteLoaderEffect } from "@/server/runtime/route-loader";
import { runServerResultEffect } from "@/server/runtime/run-server-result-effect";

export type { SessionData, SessionUser } from "@/domains/auth/model";

export const getServerSessionEffect = currentSessionEffect;

export const requireUserEffect = currentUserEffect;

export async function getServerSession() {
  return unwrapServerResult(
    await runServerResultEffect(getServerSessionEffect, {
      name: "auth.getServerSession",
    }),
  );
}

export async function requireUser() {
  return unwrapServerResult(
    await runServerResultEffect(requireUserEffect, {
      name: "auth.requireUser",
    }),
  );
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
