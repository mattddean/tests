import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

import {
  ResponseAnswerTableInputSchema,
  TestResponseTableInputSchema,
} from "@/domains/tests/schema";
import { TestTakingService } from "@/domains/tests/services/test-taking.service";
import { runServerEffect } from "@/server/runtime/run-server-effect";

import { withCurrentUser } from "./shared";

export const saveAnswerInput = Schema.extend(
  TestResponseTableInputSchema.pipe(Schema.pick("testId")),
  ResponseAnswerTableInputSchema.pipe(Schema.pick("questionId", "choiceId")),
).pipe(Schema.standardSchemaV1);
export type SaveAnswerInput = Schema.Schema.Type<typeof saveAnswerInput>;
export const saveAnswerAction = createServerFn({ method: "POST" })
  .inputValidator(saveAnswerInput)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestTakingService, (service) =>
          service.saveAnswer(data.testId, userId, data.questionId, data.choiceId),
        ).pipe(Effect.as({ ok: true })),
      ),
    ),
  );
export type SaveAnswerActionResponse = Awaited<ReturnType<typeof saveAnswerAction>>;

export const submitResponseInput = TestResponseTableInputSchema.pipe(
  Schema.pick("testId"),
  Schema.standardSchemaV1,
);
export type SubmitResponseInput = Schema.Schema.Type<typeof submitResponseInput>;
export const submitResponseAction = createServerFn({ method: "POST" })
  .inputValidator(submitResponseInput)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestTakingService, (service) =>
          service.submitResponse(data.testId, userId),
        ).pipe(Effect.as({ ok: true })),
      ),
    ),
  );
export type SubmitResponseActionResponse = Awaited<ReturnType<typeof submitResponseAction>>;
