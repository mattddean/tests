import { PgClient } from "@effect/sql-pg";
import * as PgDrizzle from "drizzle-orm/effect-postgres";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";
import { types } from "pg";
import { env } from "@/env";
import { relations } from "./relations";

const databaseUrl = new URL(env.DATABASE_URL);

const PgClientLive = PgClient.layer({
  host: databaseUrl.hostname,
  port: Number(databaseUrl.port || "5432"),
  database: databaseUrl.pathname.replace(/^\//, ""),
  username: decodeURIComponent(databaseUrl.username),
  password: Redacted.make(decodeURIComponent(databaseUrl.password)),
  ssl: databaseUrl.searchParams.get("sslmode") === "require",
  types: {
    getTypeParser: (typeId, format) => {
      if ([1184, 1114, 1082, 1186, 1231, 1115, 1185, 1187, 1182].includes(typeId)) {
        return (value: string) => value;
      }

      return types.getTypeParser(typeId, format);
    },
  },
});

console.log("[effect-db]", {
  host: databaseUrl.hostname,
  port: databaseUrl.port || "5432",
  database: databaseUrl.pathname.replace(/^\//, ""),
  user: decodeURIComponent(databaseUrl.username),
  ssl: databaseUrl.searchParams.get("sslmode"),
});

const dbEffect = PgDrizzle.make({ relations }).pipe(Effect.provide(PgDrizzle.DefaultServices));

export type DBService = Effect.Effect.Success<typeof dbEffect>;

export class DB extends Context.Tag("DB")<DB, DBService>() {}

export const DbLive = Layer.effect(DB, dbEffect).pipe(Layer.provide(PgClientLive));
