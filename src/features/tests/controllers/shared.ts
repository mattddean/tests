import { Effect } from "effect";

import { currentUserEffect } from "@/server/runtime/layers/request";

export const currentUserIdEffect = Effect.map(currentUserEffect, (user) => user.id);
