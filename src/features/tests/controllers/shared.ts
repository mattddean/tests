import { Effect } from "effect";

import { currentUserEffect } from "@/server/runtime/request-context";

export const currentUserIdEffect = Effect.map(currentUserEffect, (user) => user.id);
