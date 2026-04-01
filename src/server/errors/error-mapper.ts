import { UnauthorizedError } from "@/domains/auth/errors";
import type { TestsError } from "@/domains/tests/errors";
import { TransportError } from "./transport-error";

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error";
}

export function mapToTransportError(error: unknown) {
  if (error instanceof TransportError) {
    return error;
  }

  if (error instanceof UnauthorizedError) {
    return new TransportError(error.message, 401, error._tag);
  }

  if (error && typeof error === "object" && "_tag" in error) {
    const tagged = error as TestsError;

    switch (tagged._tag) {
      case "TestNotFound":
      case "QuestionNotFound":
      case "ChoiceNotFound":
      case "ResponseNotFound":
      case "UserNotFound":
        return new TransportError(getMessage(error), 404, tagged._tag);
      case "ForbiddenTestAccess":
      case "OnlyOwnerCanPublish":
      case "OnlyOwnerCanShareWithTakers":
      case "OnlyOwnerCanManageEditors":
      case "InviteEmailMismatch":
        return new TransportError(getMessage(error), 403, tagged._tag);
      case "CannotPublishEmptyTest":
      case "AtLeastTwoChoicesRequired":
      case "ResponseAlreadySubmitted":
      case "TestMustBePublished":
      case "RequiredQuestionsIncomplete":
      case "OwnerAlreadyHasAccess":
        return new TransportError(getMessage(error), 409, tagged._tag);
      default:
        break;
    }
  }

  return new TransportError(getMessage(error), 500, "UnexpectedServerError");
}
