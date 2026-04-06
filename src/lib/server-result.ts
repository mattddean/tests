export type ServerErrorPayload = {
  readonly _tag: string;
  readonly message: string;
  readonly status: number;
};

export type ServerSuccess<A> = {
  readonly ok: true;
  readonly value: A;
};

export type ServerFailure<E extends ServerErrorPayload = ServerErrorPayload> = {
  readonly ok: false;
  readonly error: E;
};

export type ServerResult<A, E extends ServerErrorPayload = ServerErrorPayload> =
  | ServerSuccess<A>
  | ServerFailure<E>;

export type ServerResultValue<T> = T extends
  | {
      readonly ok: true;
      readonly value: infer A;
    }
  | {
      readonly ok: false;
      readonly error: ServerErrorPayload;
    }
  ? A
  : never;

export function serverOk<A>(value: A): ServerSuccess<A> {
  return {
    ok: true,
    value,
  };
}

export function serverError<E extends ServerErrorPayload>(error: E): ServerFailure<E> {
  return {
    ok: false,
    error,
  };
}

export function isServerFailure<A, E extends ServerErrorPayload>(
  result: ServerResult<A, E>,
): result is ServerFailure<E> {
  return !result.ok;
}

export function isServerSuccess<A, E extends ServerErrorPayload>(
  result: ServerResult<A, E>,
): result is ServerSuccess<A> {
  return result.ok;
}

export function toServerResultError<E extends ServerErrorPayload>(error: E): Error & E {
  const clientError = new Error(error.message) as Error & E;
  clientError.name = error._tag;
  return Object.assign(clientError, error);
}

export function unwrapServerResult<A, E extends ServerErrorPayload>(result: ServerResult<A, E>): A {
  if (result.ok) {
    return result.value;
  }

  throw toServerResultError(result.error);
}

export function throwOnError<Args extends Array<unknown>, A, E extends ServerErrorPayload>(
  fn: (...args: Args) => Promise<ServerResult<A, E>>,
) {
  return async (...args: Args): Promise<A> => {
    return unwrapServerResult(await fn(...args));
  };
}
