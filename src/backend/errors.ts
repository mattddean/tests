import { Data } from "effect";

export type ErrorSeverity = "debug" | "info" | "warn" | "error";

export class ReportableError extends Data.Error<{
  readonly message: string;
  readonly status: number;
  readonly severity: ErrorSeverity;
  readonly userMessage?: string;
  readonly cause?: unknown;
}> {
  declare readonly _tag: string;

  constructor(
    tag: string,
    args: {
      readonly message: string;
      readonly status: number;
      readonly severity: ErrorSeverity;
      readonly userMessage?: string;
      readonly cause?: unknown;
    },
  ) {
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
        userMessage: args.userMessage ?? defaults.userMessage,
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

export class UnexpectedServerError extends makeReportableErrorClass("UnexpectedServerError", {
  status: 500,
  severity: "error",
  userMessage: "Unexpected server error",
}) {}
