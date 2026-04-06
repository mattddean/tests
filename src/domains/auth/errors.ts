import { ReportableError } from "@/backend/errors";

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
