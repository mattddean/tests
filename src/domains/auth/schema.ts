import { Schema } from "effect";
import { decodeUnknownSync } from "@/lib/effect-schema";

export const AuthSearchSchema = Schema.Struct({
  redirect: Schema.optional(Schema.String),
  email: Schema.optional(Schema.String),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const decodeAuthSearch = decodeUnknownSync(AuthSearchSchema);

export const parseAuthSearch = (input: unknown) => {
  const record = isRecord(input) ? input : {};

  return decodeAuthSearch({
    redirect: typeof record.redirect === "string" ? record.redirect : undefined,
    email: typeof record.email === "string" ? record.email : undefined,
  });
};
