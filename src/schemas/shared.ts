import type { Schema } from "effect";

import { decodeUnknownSync } from "@/lib/effect-schema";

type Infer<S extends Schema.Schema.AnyNoContext> = Schema.Schema.Type<S>;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function asOptionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

export function asNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

export function oneOf<T extends string>(value: unknown, values: ReadonlyArray<T>, fallback: T): T {
  return typeof value === "string" && values.includes(value as T) ? (value as T) : fallback;
}

export function makeUnknownParser<S extends Schema.Schema.AnyNoContext>(
  schema: S,
  normalize: (input: unknown) => Infer<S>,
) {
  const decode = decodeUnknownSync(schema);
  return (input: unknown): Infer<S> => decode(normalize(input));
}
