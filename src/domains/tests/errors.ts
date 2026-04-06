import { type ErrorSeverity, ReportableError } from "@/backend/errors";

function makeTestsErrorClass<Tag extends string>(
  tag: Tag,
  defaults: {
    readonly status: number;
    readonly severity: ErrorSeverity;
    readonly userMessage?: string;
  },
) {
  return class extends ReportableError {
    readonly _tag = tag;

    constructor(args: {
      readonly message: string;
      readonly userMessage?: string;
      readonly severity?: ErrorSeverity;
      readonly cause?: unknown;
    }) {
      super(tag, {
        message: args.message,
        userMessage: args.userMessage ?? defaults.userMessage ?? args.message,
        severity: args.severity ?? defaults.severity,
        status: defaults.status,
        cause: args.cause,
      });
    }
  } as new (args: {
    readonly message: string;
    readonly userMessage?: string;
    readonly severity?: ErrorSeverity;
    readonly cause?: unknown;
  }) => ReportableError & { readonly _tag: Tag };
}

export class TestNotFound extends makeTestsErrorClass("TestNotFound", {
  status: 404,
  severity: "debug",
}) {}

export class QuestionNotFound extends makeTestsErrorClass("QuestionNotFound", {
  status: 404,
  severity: "debug",
}) {}

export class ChoiceNotFound extends makeTestsErrorClass("ChoiceNotFound", {
  status: 404,
  severity: "debug",
}) {}

export class ResponseNotFound extends makeTestsErrorClass("ResponseNotFound", {
  status: 404,
  severity: "debug",
}) {}

export class UserNotFound extends makeTestsErrorClass("UserNotFound", {
  status: 404,
  severity: "debug",
}) {}

export class ForbiddenTestAccess extends makeTestsErrorClass("ForbiddenTestAccess", {
  status: 403,
  severity: "debug",
}) {}

export class OnlyOwnerCanPublish extends makeTestsErrorClass("OnlyOwnerCanPublish", {
  status: 403,
  severity: "debug",
}) {}

export class OnlyOwnerCanShareWithTakers extends makeTestsErrorClass(
  "OnlyOwnerCanShareWithTakers",
  {
    status: 403,
    severity: "debug",
  },
) {}

export class OnlyOwnerCanManageEditors extends makeTestsErrorClass("OnlyOwnerCanManageEditors", {
  status: 403,
  severity: "debug",
}) {}

export class CannotPublishEmptyTest extends makeTestsErrorClass("CannotPublishEmptyTest", {
  status: 409,
  severity: "debug",
}) {}

export class AtLeastTwoChoicesRequired extends makeTestsErrorClass("AtLeastTwoChoicesRequired", {
  status: 409,
  severity: "debug",
}) {}

export class ResponseAlreadySubmitted extends makeTestsErrorClass("ResponseAlreadySubmitted", {
  status: 409,
  severity: "debug",
}) {}

export class InviteEmailMismatch extends makeTestsErrorClass("InviteEmailMismatch", {
  status: 403,
  severity: "debug",
}) {}

export class TestMustBePublished extends makeTestsErrorClass("TestMustBePublished", {
  status: 409,
  severity: "debug",
}) {}

export class RequiredQuestionsIncomplete extends makeTestsErrorClass(
  "RequiredQuestionsIncomplete",
  {
    status: 409,
    severity: "debug",
  },
) {}

export class OwnerAlreadyHasAccess extends makeTestsErrorClass("OwnerAlreadyHasAccess", {
  status: 409,
  severity: "debug",
}) {}

export type TestsError =
  | AtLeastTwoChoicesRequired
  | CannotPublishEmptyTest
  | ChoiceNotFound
  | ForbiddenTestAccess
  | InviteEmailMismatch
  | OnlyOwnerCanManageEditors
  | OnlyOwnerCanPublish
  | OnlyOwnerCanShareWithTakers
  | OwnerAlreadyHasAccess
  | QuestionNotFound
  | RequiredQuestionsIncomplete
  | ResponseAlreadySubmitted
  | ResponseNotFound
  | TestMustBePublished
  | TestNotFound
  | UserNotFound;
