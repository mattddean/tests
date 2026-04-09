import { Schema } from "effect";

export const SessionUserSchema = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  name: Schema.String,
  image: Schema.NullOr(Schema.String),
});

export const SessionDataSchema = Schema.Struct({
  user: SessionUserSchema,
});

export type SessionUser = Schema.Schema.Type<typeof SessionUserSchema>;
export type SessionData = Schema.Schema.Type<typeof SessionDataSchema>;
