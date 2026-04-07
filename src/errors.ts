import { Data } from "effect";

export type ErrorSeverity = "debug" | "info" | "warn" | "error";

type ReportableErrorArgs = {
  readonly message: string;
  readonly status: number;
  readonly severity: ErrorSeverity;
  readonly userMessage?: string;
  readonly cause?: unknown;
};

type ReportableErrorInput = {
  readonly message: string;
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
    readonly status: number;
    readonly severity: ErrorSeverity;
    readonly userMessage?: string;
    readonly exposeMessageAsUserMessage?: boolean;
  },
) {
  return class extends ReportableError {
    readonly _tag = tag;

    constructor(args: ReportableErrorInput) {
      super(tag, {
        message: args.message,
        userMessage:
          args.userMessage ??
          (defaults.exposeMessageAsUserMessage ? args.message : defaults.userMessage),
        severity: args.severity ?? defaults.severity,
        status: defaults.status,
        cause: args.cause,
      });
    }
  } as new (args: ReportableErrorInput) => ReportableError & { readonly _tag: Tag };
}

export class ForbiddenError extends makeReportableErrorClass("ForbiddenError", {
  status: 403,
  severity: "debug",
}) {}

export class NotFoundError extends makeReportableErrorClass("NotFoundError", {
  status: 404,
  severity: "debug",
}) {}

export class ConflictError extends makeReportableErrorClass("ConflictError", {
  status: 409,
  severity: "debug",
}) {}

export class InvalidStateError extends makeReportableErrorClass("InvalidStateError", {
  status: 409,
  severity: "debug",
}) {}

export class UnauthorizedError extends makeReportableErrorClass("UnauthorizedError", {
  status: 401,
  severity: "debug",
  exposeMessageAsUserMessage: true,
}) {}

export class UnexpectedServerError extends makeReportableErrorClass("UnexpectedServerError", {
  status: 500,
  severity: "error",
  userMessage: "Unexpected server error",
}) {}

export class TestNotFound extends makeReportableErrorClass("TestNotFound", {
  status: 404,
  severity: "debug",
  exposeMessageAsUserMessage: true,
}) {}

export class QuestionNotFound extends makeReportableErrorClass("QuestionNotFound", {
  status: 404,
  severity: "debug",
  exposeMessageAsUserMessage: true,
}) {}

export class ChoiceNotFound extends makeReportableErrorClass("ChoiceNotFound", {
  status: 404,
  severity: "debug",
  exposeMessageAsUserMessage: true,
}) {}

export class ResponseNotFound extends makeReportableErrorClass("ResponseNotFound", {
  status: 404,
  severity: "debug",
  exposeMessageAsUserMessage: true,
}) {}

export class UserNotFound extends makeReportableErrorClass("UserNotFound", {
  status: 404,
  severity: "debug",
  exposeMessageAsUserMessage: true,
}) {}

export class ForbiddenTestAccess extends makeReportableErrorClass("ForbiddenTestAccess", {
  status: 403,
  severity: "debug",
  exposeMessageAsUserMessage: true,
}) {}

export class OnlyOwnerCanPublish extends makeReportableErrorClass("OnlyOwnerCanPublish", {
  status: 403,
  severity: "debug",
  exposeMessageAsUserMessage: true,
}) {}

export class OnlyOwnerCanShareWithTakers extends makeReportableErrorClass(
  "OnlyOwnerCanShareWithTakers",
  {
    status: 403,
    severity: "debug",
    exposeMessageAsUserMessage: true,
  },
) {}

export class OnlyOwnerCanManageEditors extends makeReportableErrorClass(
  "OnlyOwnerCanManageEditors",
  {
    status: 403,
    severity: "debug",
    exposeMessageAsUserMessage: true,
  },
) {}

export class CannotPublishEmptyTest extends makeReportableErrorClass("CannotPublishEmptyTest", {
  status: 409,
  severity: "debug",
  exposeMessageAsUserMessage: true,
}) {}

export class AtLeastTwoChoicesRequired extends makeReportableErrorClass(
  "AtLeastTwoChoicesRequired",
  {
    status: 409,
    severity: "debug",
    exposeMessageAsUserMessage: true,
  },
) {}

export class ResponseAlreadySubmitted extends makeReportableErrorClass("ResponseAlreadySubmitted", {
  status: 409,
  severity: "debug",
  exposeMessageAsUserMessage: true,
}) {}

export class InviteEmailMismatch extends makeReportableErrorClass("InviteEmailMismatch", {
  status: 403,
  severity: "debug",
  exposeMessageAsUserMessage: true,
}) {}

export class TestMustBePublished extends makeReportableErrorClass("TestMustBePublished", {
  status: 409,
  severity: "debug",
  exposeMessageAsUserMessage: true,
}) {}

export class RequiredQuestionsIncomplete extends makeReportableErrorClass(
  "RequiredQuestionsIncomplete",
  {
    status: 409,
    severity: "debug",
    exposeMessageAsUserMessage: true,
  },
) {}

export class OwnerAlreadyHasAccess extends makeReportableErrorClass("OwnerAlreadyHasAccess", {
  status: 409,
  severity: "debug",
  exposeMessageAsUserMessage: true,
}) {}
