import { Data } from "effect";

export class UnauthorizedError extends Data.TaggedError("UnauthorizedError")<{
  readonly message: string;
}> {}

export class ForbiddenError extends Data.TaggedError("ForbiddenError")<{
  readonly message: string;
}> {}

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  readonly message: string;
}> {}

export class ConflictError extends Data.TaggedError("ConflictError")<{
  readonly message: string;
}> {}

export class InvalidStateError extends Data.TaggedError("InvalidStateError")<{
  readonly message: string;
}> {}

export class UnexpectedServerError extends Data.TaggedError("UnexpectedServerError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type BackendError =
  | ConflictError
  | ForbiddenError
  | InvalidStateError
  | NotFoundError
  | UnauthorizedError
  | UnexpectedServerError
  | Error;
