import { Schema } from "effect";

export const AuthSearchSchema = Schema.Struct({
  redirect: Schema.optional(Schema.String),
  email: Schema.optional(Schema.String),
});
