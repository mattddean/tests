import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

import { TestTakingService } from "@/domains/tests/services/test-taking.service";
import { ResponseAnswerTableInputSchema, TestResponseTableInputSchema } from "@/schemas/entities";
import { runServerResultEffect } from "@/server/runtime/run-server-result-effect";

import { currentUserIdEffect } from "./shared";

export const saveAnswerInput = Schema.extend(
  TestResponseTableInputSchema.pipe(Schema.pick("testId")),
  ResponseAnswerTableInputSchema.pipe(Schema.pick("questionId", "choiceId")),
).pipe(Schema.standardSchemaV1);
export type SaveAnswerInput = Schema.Schema.Type<typeof saveAnswerInput>;
export const saveAnswerAction = createServerFn({ method: "POST" })
  .inputValidator(saveAnswerInput)
  .handler(({ data }) =>
    runServerResultEffect(
      Effect.gen(function* () {
        const userId = yield* currentUserIdEffect;
        const testTakingService = yield* TestTakingService;
        yield* testTakingService.saveAnswer(data.testId, userId, data.questionId, data.choiceId);
      }),
      { name: "tests.saveAnswer" },
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
    runServerResultEffect(
      Effect.gen(function* () {
        const userId = yield* currentUserIdEffect;
        const testTakingService = yield* TestTakingService;
        yield* testTakingService.submitResponse(data.testId, userId);
      }),
      { name: "tests.submitResponse" },
    ),
  );
export type SubmitResponseActionResponse = Awaited<ReturnType<typeof submitResponseAction>>;
