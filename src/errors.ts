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

export class ForbiddenError extends ReportableError {
  readonly _tag = "ForbiddenError";

  constructor(args: ReportableErrorInput) {
    super("ForbiddenError", {
      message: args.message,
      userMessage: args.userMessage,
      severity: args.severity ?? "debug",
      status: 403,
      cause: args.cause,
    });
  }
}

export class NotFoundError extends ReportableError {
  readonly _tag = "NotFoundError";

  constructor(args: ReportableErrorInput) {
    super("NotFoundError", {
      message: args.message,
      userMessage: args.userMessage,
      severity: args.severity ?? "debug",
      status: 404,
      cause: args.cause,
    });
  }
}

export class ConflictError extends ReportableError {
  readonly _tag = "ConflictError";

  constructor(args: ReportableErrorInput) {
    super("ConflictError", {
      message: args.message,
      userMessage: args.userMessage,
      severity: args.severity ?? "debug",
      status: 409,
      cause: args.cause,
    });
  }
}

export class InvalidStateError extends ReportableError {
  readonly _tag = "InvalidStateError";

  constructor(args: ReportableErrorInput) {
    super("InvalidStateError", {
      message: args.message,
      userMessage: args.userMessage,
      severity: args.severity ?? "debug",
      status: 409,
      cause: args.cause,
    });
  }
}

export class UnauthorizedError extends ReportableError {
  readonly _tag = "UnauthorizedError";

  constructor(args: { readonly message: string; readonly cause?: unknown }) {
    super("UnauthorizedError", {
      message: args.message,
      userMessage: args.message,
      severity: "debug",
      status: 401,
      cause: args.cause,
    });
  }
}

export class UnexpectedServerError extends ReportableError {
  readonly _tag = "UnexpectedServerError";

  constructor(args: ReportableErrorInput) {
    super("UnexpectedServerError", {
      message: args.message,
      userMessage: args.userMessage ?? "Unexpected server error",
      severity: args.severity ?? "error",
      status: 500,
      cause: args.cause,
    });
  }
}

export class TestNotFound extends ReportableError {
  readonly _tag = "TestNotFound";

  constructor(args: ReportableErrorInput) {
    super("TestNotFound", {
      message: args.message,
      userMessage: args.userMessage ?? args.message,
      severity: args.severity ?? "debug",
      status: 404,
      cause: args.cause,
    });
  }
}

export class QuestionNotFound extends ReportableError {
  readonly _tag = "QuestionNotFound";

  constructor(args: ReportableErrorInput) {
    super("QuestionNotFound", {
      message: args.message,
      userMessage: args.userMessage ?? args.message,
      severity: args.severity ?? "debug",
      status: 404,
      cause: args.cause,
    });
  }
}

export class ChoiceNotFound extends ReportableError {
  readonly _tag = "ChoiceNotFound";

  constructor(args: ReportableErrorInput) {
    super("ChoiceNotFound", {
      message: args.message,
      userMessage: args.userMessage ?? args.message,
      severity: args.severity ?? "debug",
      status: 404,
      cause: args.cause,
    });
  }
}

export class ResponseNotFound extends ReportableError {
  readonly _tag = "ResponseNotFound";

  constructor(args: ReportableErrorInput) {
    super("ResponseNotFound", {
      message: args.message,
      userMessage: args.userMessage ?? args.message,
      severity: args.severity ?? "debug",
      status: 404,
      cause: args.cause,
    });
  }
}

export class UserNotFound extends ReportableError {
  readonly _tag = "UserNotFound";

  constructor(args: ReportableErrorInput) {
    super("UserNotFound", {
      message: args.message,
      userMessage: args.userMessage ?? args.message,
      severity: args.severity ?? "debug",
      status: 404,
      cause: args.cause,
    });
  }
}

export class ForbiddenTestAccess extends ReportableError {
  readonly _tag = "ForbiddenTestAccess";

  constructor(args: ReportableErrorInput) {
    super("ForbiddenTestAccess", {
      message: args.message,
      userMessage: args.userMessage ?? args.message,
      severity: args.severity ?? "debug",
      status: 403,
      cause: args.cause,
    });
  }
}

export class OnlyOwnerCanPublish extends ReportableError {
  readonly _tag = "OnlyOwnerCanPublish";

  constructor(args: ReportableErrorInput) {
    super("OnlyOwnerCanPublish", {
      message: args.message,
      userMessage: args.userMessage ?? args.message,
      severity: args.severity ?? "debug",
      status: 403,
      cause: args.cause,
    });
  }
}

export class OnlyOwnerCanShareWithTakers extends ReportableError {
  readonly _tag = "OnlyOwnerCanShareWithTakers";

  constructor(args: ReportableErrorInput) {
    super("OnlyOwnerCanShareWithTakers", {
      message: args.message,
      userMessage: args.userMessage ?? args.message,
      severity: args.severity ?? "debug",
      status: 403,
      cause: args.cause,
    });
  }
}

export class OnlyOwnerCanManageEditors extends ReportableError {
  readonly _tag = "OnlyOwnerCanManageEditors";

  constructor(args: ReportableErrorInput) {
    super("OnlyOwnerCanManageEditors", {
      message: args.message,
      userMessage: args.userMessage ?? args.message,
      severity: args.severity ?? "debug",
      status: 403,
      cause: args.cause,
    });
  }
}

export class CannotPublishEmptyTest extends ReportableError {
  readonly _tag = "CannotPublishEmptyTest";

  constructor(args: ReportableErrorInput) {
    super("CannotPublishEmptyTest", {
      message: args.message,
      userMessage: args.userMessage ?? args.message,
      severity: args.severity ?? "debug",
      status: 409,
      cause: args.cause,
    });
  }
}

export class AtLeastTwoChoicesRequired extends ReportableError {
  readonly _tag = "AtLeastTwoChoicesRequired";

  constructor(args: ReportableErrorInput) {
    super("AtLeastTwoChoicesRequired", {
      message: args.message,
      userMessage: args.userMessage ?? args.message,
      severity: args.severity ?? "debug",
      status: 409,
      cause: args.cause,
    });
  }
}

export class ResponseAlreadySubmitted extends ReportableError {
  readonly _tag = "ResponseAlreadySubmitted";

  constructor(args: ReportableErrorInput) {
    super("ResponseAlreadySubmitted", {
      message: args.message,
      userMessage: args.userMessage ?? args.message,
      severity: args.severity ?? "debug",
      status: 409,
      cause: args.cause,
    });
  }
}

export class InviteEmailMismatch extends ReportableError {
  readonly _tag = "InviteEmailMismatch";

  constructor(args: ReportableErrorInput) {
    super("InviteEmailMismatch", {
      message: args.message,
      userMessage: args.userMessage ?? args.message,
      severity: args.severity ?? "debug",
      status: 403,
      cause: args.cause,
    });
  }
}

export class TestMustBePublished extends ReportableError {
  readonly _tag = "TestMustBePublished";

  constructor(args: ReportableErrorInput) {
    super("TestMustBePublished", {
      message: args.message,
      userMessage: args.userMessage ?? args.message,
      severity: args.severity ?? "debug",
      status: 409,
      cause: args.cause,
    });
  }
}

export class RequiredQuestionsIncomplete extends ReportableError {
  readonly _tag = "RequiredQuestionsIncomplete";

  constructor(args: ReportableErrorInput) {
    super("RequiredQuestionsIncomplete", {
      message: args.message,
      userMessage: args.userMessage ?? args.message,
      severity: args.severity ?? "debug",
      status: 409,
      cause: args.cause,
    });
  }
}

export class OwnerAlreadyHasAccess extends ReportableError {
  readonly _tag = "OwnerAlreadyHasAccess";

  constructor(args: ReportableErrorInput) {
    super("OwnerAlreadyHasAccess", {
      message: args.message,
      userMessage: args.userMessage ?? args.message,
      severity: args.severity ?? "debug",
      status: 409,
      cause: args.cause,
    });
  }
}
