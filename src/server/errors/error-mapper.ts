import type { TestsError } from "@/domains/tests/errors";
import type { ServerErrorPayload } from "@/lib/server-result";

import { UnauthorizedError } from "@/domains/auth/errors";

import { TransportError } from "./transport-error";

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error";
}

function getUnexpectedServerError(): ServerErrorPayload {
  return {
    _tag: "UnexpectedServerError",
    message: "Unexpected server error",
    status: 500,
  };
}

export function classifyServerError(error: unknown): {
  readonly error: ServerErrorPayload;
  readonly shouldReport: boolean;
} {
  if (error instanceof TransportError) {
    return {
      error: {
        _tag: error.code,
        message: error.message,
        status: error.status,
      },
      shouldReport: false,
    };
  }

  if (error instanceof UnauthorizedError) {
    return {
      error: {
        _tag: error._tag,
        message: error.message,
        status: 401,
      },
      shouldReport: false,
    };
  }

  if (error && typeof error === "object" && "_tag" in error) {
    const tagged = error as TestsError;

    switch (tagged._tag) {
      case "TestNotFound":
      case "QuestionNotFound":
      case "ChoiceNotFound":
      case "ResponseNotFound":
      case "UserNotFound":
        return {
          error: {
            _tag: tagged._tag,
            message: getMessage(error),
            status: 404,
          },
          shouldReport: false,
        };
      case "ForbiddenTestAccess":
      case "OnlyOwnerCanPublish":
      case "OnlyOwnerCanShareWithTakers":
      case "OnlyOwnerCanManageEditors":
      case "InviteEmailMismatch":
        return {
          error: {
            _tag: tagged._tag,
            message: getMessage(error),
            status: 403,
          },
          shouldReport: false,
        };
      case "CannotPublishEmptyTest":
      case "AtLeastTwoChoicesRequired":
      case "ResponseAlreadySubmitted":
      case "TestMustBePublished":
      case "RequiredQuestionsIncomplete":
      case "OwnerAlreadyHasAccess":
        return {
          error: {
            _tag: tagged._tag,
            message: getMessage(error),
            status: 409,
          },
          shouldReport: false,
        };
      default:
        tagged satisfies never;
        break;
    }
  }

  return {
    error: getUnexpectedServerError(),
    shouldReport: true,
  };
}

export function mapToTransportError(error: unknown) {
  if (error instanceof TransportError) {
    return error;
  }

  const classifiedError = classifyServerError(error);
  return new TransportError(
    classifiedError.error.message,
    classifiedError.error.status,
    classifiedError.error._tag,
  );
}
