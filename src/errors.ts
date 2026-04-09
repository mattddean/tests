import * as Data from "effect/Data";

export type ErrorSeverity = "debug" | "info" | "warn" | "error";

type ReportableErrorArgs = {
  readonly message: string;
  readonly status: number;
  readonly severity: ErrorSeverity;
  readonly userMessage?: string;
  readonly cause?: unknown;
};

type ReportableErrorInput = {
  readonly message?: string;
  readonly userMessage?: string;
  readonly severity?: ErrorSeverity;
  readonly cause?: unknown;
};

export class ReportableError extends Data.Error<{
  readonly message: string;
  readonly status: number;
  readonly severity: ErrorSeverity;
  readonly userMessage?: string;
  readonly cause?: unknown;
}> {
  declare readonly _tag: string;

  constructor(tag: string, args: ReportableErrorArgs) {
    super(args);
    this.name = tag;
  }
}

function makeReportableErrorClass<Tag extends string>(
  tag: Tag,
  defaults: {
    readonly message: string;
    readonly userMessage: string;
    readonly severity: ErrorSeverity;
    readonly status: number;
  },
) {
  return class extends ReportableError {
    readonly _tag = tag;

    constructor(args: ReportableErrorInput = {}) {
      super(tag, {
        message: args.message ?? defaults.message,
        userMessage: args.userMessage ?? defaults.userMessage,
        severity: args.severity ?? defaults.severity,
        status: defaults.status,
        cause: args.cause,
      });
    }
  };
}

export class ForbiddenError extends makeReportableErrorClass("ForbiddenError", {
  message: "Forbidden",
  userMessage: "Forbidden",
  status: 403,
  severity: "debug",
}) {}

export class NotFoundError extends makeReportableErrorClass("NotFoundError", {
  message: "Not found",
  userMessage: "Not found",
  status: 404,
  severity: "debug",
}) {}

export class ConflictError extends makeReportableErrorClass("ConflictError", {
  message: "Conflict",
  userMessage: "Conflict",
  status: 409,
  severity: "debug",
}) {}

export class InvalidStateError extends makeReportableErrorClass("InvalidStateError", {
  message: "Invalid state",
  userMessage: "Invalid state",
  status: 409,
  severity: "debug",
}) {}

export class UnauthorizedError extends makeReportableErrorClass("UnauthorizedError", {
  message: "Unauthorized",
  userMessage: "Unauthorized",
  status: 401,
  severity: "debug",
}) {}

export class UnexpectedServerError extends makeReportableErrorClass("UnexpectedServerError", {
  message: "Unexpected server error",
  status: 500,
  severity: "error",
  userMessage: "Internal Server Error",
}) {}

export class TestNotFound extends makeReportableErrorClass("TestNotFound", {
  message: "Test not found",
  userMessage: "Test not found",
  status: 404,
  severity: "debug",
}) {}

export class QuestionNotFound extends makeReportableErrorClass("QuestionNotFound", {
  message: "Question not found",
  userMessage: "Question not found",
  status: 404,
  severity: "debug",
}) {}

export class ChoiceNotFound extends makeReportableErrorClass("ChoiceNotFound", {
  message: "Choice not found",
  userMessage: "Choice not found",
  status: 404,
  severity: "debug",
}) {}

export class ResponseNotFound extends makeReportableErrorClass("ResponseNotFound", {
  message: "Response not found",
  userMessage: "Response not found",
  status: 404,
  severity: "debug",
}) {}

export class UserNotFound extends makeReportableErrorClass("UserNotFound", {
  message: "User not found",
  userMessage: "User not found",
  status: 404,
  severity: "debug",
}) {}

export class ForbiddenTestAccess extends makeReportableErrorClass("ForbiddenTestAccess", {
  message: "Forbidden",
  userMessage: "Forbidden",
  status: 403,
  severity: "debug",
}) {}

export class OnlyOwnerCanPublish extends makeReportableErrorClass("OnlyOwnerCanPublish", {
  message: "Only owners can publish tests",
  userMessage: "Only owners can publish tests",
  status: 403,
  severity: "debug",
}) {}

export class OnlyOwnerCanShareWithTakers extends makeReportableErrorClass(
  "OnlyOwnerCanShareWithTakers",
  {
    message: "Only owners can invite takers",
    userMessage: "Only owners can invite takers",
    status: 403,
    severity: "debug",
  },
) {}

export class OnlyOwnerCanManageEditors extends makeReportableErrorClass(
  "OnlyOwnerCanManageEditors",
  {
    message: "Only owners can manage editors",
    userMessage: "Only owners can manage editors",
    status: 403,
    severity: "debug",
  },
) {}

export class CannotPublishEmptyTest extends makeReportableErrorClass("CannotPublishEmptyTest", {
  message: "Cannot publish an empty test",
  userMessage: "Cannot publish an empty test",
  status: 409,
  severity: "debug",
}) {}

export class AtLeastTwoChoicesRequired extends makeReportableErrorClass(
  "AtLeastTwoChoicesRequired",
  {
    message: "Each question must keep at least two choices",
    userMessage: "Each question must keep at least two choices",
    status: 409,
    severity: "debug",
  },
) {}

export class ResponseAlreadySubmitted extends makeReportableErrorClass("ResponseAlreadySubmitted", {
  message: "Response already submitted",
  userMessage: "Response already submitted",
  status: 409,
  severity: "debug",
}) {}

export class InviteEmailMismatch extends makeReportableErrorClass("InviteEmailMismatch", {
  message: "Invite email does not match the signed-in account",
  userMessage: "Invite email does not match the signed-in account",
  status: 403,
  severity: "debug",
}) {}

export class TestMustBePublished extends makeReportableErrorClass("TestMustBePublished", {
  message: "Test must be published",
  userMessage: "Test must be published",
  status: 409,
  severity: "debug",
}) {}

export class RequiredQuestionsIncomplete extends makeReportableErrorClass(
  "RequiredQuestionsIncomplete",
  {
    message: "Required questions are incomplete",
    userMessage: "Required questions are incomplete",
    status: 409,
    severity: "debug",
  },
) {}

export class OwnerAlreadyHasAccess extends makeReportableErrorClass("OwnerAlreadyHasAccess", {
  message: "The owner already has access",
  userMessage: "The owner already has access",
  status: 409,
  severity: "debug",
}) {}
