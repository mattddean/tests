import { Effect } from "effect";

import { currentUserEffect } from "@/server/runtime/request-context";

export function withCurrentUser<A, E, R>(run: (userId: string) => Effect.Effect<A, E, R>) {
  return Effect.gen(function* () {
    const user = yield* currentUserEffect;
    return yield* run(user.id);
  });
}
