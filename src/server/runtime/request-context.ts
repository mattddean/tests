import { Context, Effect, Layer } from "effect";

import type { SessionData, SessionUser } from "@/domains/auth/model";

import { UnauthorizedError } from "@/domains/auth/errors";
import { AuthService } from "@/server/auth/auth-service";

export type RequestContextShape = {
  readonly headers: Headers;
  readonly requestId: string;
  readonly method?: string;
  readonly pathname?: string;
};

export class RequestContext extends Context.Tag("RequestContext")<
  RequestContext,
  RequestContextShape
>() {}

export class CurrentSession extends Context.Tag("CurrentSession")<
  CurrentSession,
  SessionData | null
>() {}

export type CurrentUserShape = {
  readonly user: SessionUser | null;
};

export class CurrentUser extends Context.Tag("CurrentUser")<CurrentUser, CurrentUserShape>() {}

export const currentUserEffect: Effect.Effect<SessionUser, UnauthorizedError, CurrentUser> =
  Effect.gen(function* () {
    const currentUser = yield* CurrentUser;

    if (!currentUser.user) {
      return yield* Effect.fail(new UnauthorizedError({ message: "Unauthorized" }));
    }

    return currentUser.user;
  });

export function makeRequestContextLayer(headers: Headers) {
  return Layer.succeed(RequestContext, {
    headers,
    requestId: crypto.randomUUID(),
  } satisfies RequestContextShape);
}

export const CurrentSessionLive = Layer.effect(
  CurrentSession,
  Effect.gen(function* () {
    const requestContext = yield* RequestContext;
    const authService = yield* AuthService;
    return yield* authService.getSession(requestContext.headers);
  }),
);

export const CurrentUserLive = Layer.effect(
  CurrentUser,
  Effect.gen(function* () {
    const session = yield* CurrentSession;
    return {
      user: session?.user ?? null,
    } satisfies CurrentUserShape;
  }),
);

export function makeRequestLayer(headers: Headers) {
  const requestContextLayer = makeRequestContextLayer(headers);
  const currentSessionLayer = CurrentSessionLive.pipe(Layer.provide(requestContextLayer));
  const currentUserLayer = CurrentUserLive.pipe(Layer.provide(currentSessionLayer));

  return Layer.mergeAll(requestContextLayer, currentSessionLayer, currentUserLayer);
}
