import type { Effect, Schema } from "effect";

import { encodeUnknownSync } from "@/lib/effect-schema";

import { runServerEffect } from "./run-server-effect";

type SchemaAny = Schema.Schema.AnyNoContext;

function encodeOutput<S extends SchemaAny>(schema: S | undefined, value: Schema.Schema.Type<S>) {
  if (!schema) {
    return value;
  }

  return encodeUnknownSync(schema)(value);
}

export function makeServerQuery<
  Input,
  Output,
  ErrorType,
  Requirements,
  OutputSchema extends SchemaAny | undefined = undefined,
>(options: {
  readonly run: (input: Input) => Effect.Effect<Output, ErrorType, Requirements>;
  readonly outputSchema?: OutputSchema;
}) {
  return async ({ data }: { readonly data: Input }) => {
    const result = await runServerEffect(options.run(data));
    return encodeOutput(
      options.outputSchema,
      result as Schema.Schema.Type<NonNullable<OutputSchema>>,
    );
  };
}

export const makeServerCommand = makeServerQuery;
