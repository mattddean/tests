import type { ServerErrorPayload } from "@/lib/server-result";

import { ReportableError, UnexpectedServerError } from "@/errors";

import { TransportError } from "./transport-error";

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : "Internal Server Error";
}

function toPayload(error: ReportableError): ServerErrorPayload {
  return {
    _tag: error._tag,
    message: error.userMessage ?? "Internal Server Error",
    status: error.status,
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

  if (error instanceof ReportableError) {
    return {
      error: toPayload(error),
      shouldReport: error.severity !== "debug",
    };
  }

  const genericError = new UnexpectedServerError({
    message: getMessage(error),
    cause: error,
  });

  return {
    error: toPayload(genericError),
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
