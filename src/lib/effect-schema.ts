import { ParseResult } from "effect";
import type { Schema } from "effect";

export function decodeUnknownSync<S extends Schema.Schema.AnyNoContext>(
  schema: S,
): (input: unknown) => Schema.Schema.Type<S> {
  return ParseResult.decodeUnknownSync(schema);
}

export function encodeUnknownSync<S extends Schema.Schema.AnyNoContext>(
  schema: S,
): (input: Schema.Schema.Type<S>) => Schema.Schema.Encoded<S> {
  return ParseResult.encodeUnknownSync(schema);
}
