import { getRequest } from "@tanstack/react-start/server";
import { Context, Effect, Layer } from "effect";

import type { SessionData, SessionUser } from "@/domains/auth/model";

import { UnauthorizedError } from "@/domains/auth/errors";
import { AuthService } from "@/server/auth/auth-service";
import { getRequestTraceDetails } from "@/server/observability/tracing";

export class CurrentRequest extends Context.Tag("CurrentRequest")<CurrentRequest, Request>() {}

export type RequestContextShape = {
  readonly headers: Headers;
  readonly requestId: string;
  readonly method: string;
  readonly pathname: string;
};

export class RequestContext extends Context.Tag("RequestContext")<
  RequestContext,
  RequestContextShape
>() {}

export class CurrentSession extends Context.Tag("CurrentSession")<
  CurrentSession,
  SessionData | null
>() {}

export const CurrentRequestLive = Layer.sync(CurrentRequest, () => getRequest());

export const currentSessionEffect: Effect.Effect<SessionData | null, never, CurrentSession> =
  CurrentSession;

export const currentUserEffect: Effect.Effect<SessionUser, UnauthorizedError, CurrentSession> =
  Effect.gen(function* () {
    const session = yield* currentSessionEffect;

    if (!session?.user) {
      return yield* Effect.fail(new UnauthorizedError({ message: "Unauthorized" }));
    }

    return session.user;
  });

export const CurrentSessionLive = Layer.effect(
  CurrentSession,
  Effect.gen(function* () {
    const request = yield* CurrentRequest;
    const authService = yield* AuthService;
    return yield* authService.getSession(request.headers);
  }),
);

export function makeRequestContext(request: Request): RequestContextShape {
  const requestDetails = getRequestTraceDetails(request);

  return {
    headers: requestDetails.headers,
    requestId: requestDetails.requestId,
    method: requestDetails.method,
    pathname: requestDetails.pathname,
  } satisfies RequestContextShape;
}

export const RequestContextLive = Layer.effect(
  RequestContext,
  Effect.map(CurrentRequest, makeRequestContext),
);

export function makeRequestLayerFromRequest(request: Request) {
  const currentRequestLayer = Layer.succeed(CurrentRequest, request);

  return Layer.mergeAll(RequestContextLive, CurrentSessionLive).pipe(
    Layer.provideMerge(currentRequestLayer),
  );
}

export function makeRequestLayer() {
  return Layer.mergeAll(RequestContextLive, CurrentSessionLive).pipe(
    Layer.provideMerge(CurrentRequestLive),
  );
}
