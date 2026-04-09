import { Effect } from "effect";

import { currentUserEffect } from "@/lib/runtime/layers/request";

export const currentUserIdEffect = Effect.map(currentUserEffect, (user) => user.id);
