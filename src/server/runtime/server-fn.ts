import type { Effect, Schema } from "effect";

import { encodeUnknownSync } from "@/lib/effect-schema";
import { serverOk } from "@/lib/server-result";

import { runServerResultEffect } from "./run-server-result-effect";

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
  readonly name: string;
}) {
  return async ({ data }: { readonly data: Input }) => {
    const result = await runServerResultEffect(options.run(data), {
      name: options.name,
    });

    if (!result.ok) {
      return result;
    }

    return serverOk(
      encodeOutput(options.outputSchema, result.value as Schema.Schema.Type<NonNullable<OutputSchema>>),
    );
  };
}

export const makeServerCommand = makeServerQuery;
