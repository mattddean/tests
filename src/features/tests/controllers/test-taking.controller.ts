import { Effect } from "effect";
import { createServerFn } from "@tanstack/react-start";
import { TestTakingService } from "@/domains/tests/services/test-taking.service";
import { saveAnswerInputValidator, submitResponseInputValidator } from "@/domains/tests/schema";
import { runServerEffect } from "@/server/runtime/run-server-effect";
import { withCurrentUser } from "./shared";

export const saveAnswerAction = createServerFn({ method: "POST" })
  .inputValidator(saveAnswerInputValidator)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestTakingService, (service) =>
          service.saveAnswer(data.testId, userId, data.questionId, data.choiceId),
        ).pipe(Effect.as({ ok: true })),
      ),
    ),
  );

export const submitResponseAction = createServerFn({ method: "POST" })
  .inputValidator(submitResponseInputValidator)
  .handler(({ data }) =>
    runServerEffect(
      withCurrentUser((userId) =>
        Effect.flatMap(TestTakingService, (service) => service.submitResponse(data.testId, userId)).pipe(
          Effect.as({ ok: true }),
        ),
      ),
    ),
  );
