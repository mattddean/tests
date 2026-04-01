import { Context, Effect, Layer } from "effect";
import { type SessionData } from "@/domains/auth/model";
import { auth } from "./better-auth";

export type AuthServiceShape = {
  readonly getSession: (headers: Headers) => Effect.Effect<SessionData | null, Error>;
};

export class AuthService extends Context.Tag("AuthService")<AuthService, AuthServiceShape>() {}

export const AuthServiceLive = Layer.succeed(AuthService, {
  getSession: (headers) =>
    Effect.tryPromise({
      try: async () => {
        const session = await auth.api.getSession({ headers });

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
      },
      catch: (cause) => (cause instanceof Error ? cause : new Error("Failed to load session")),
    }),
});
