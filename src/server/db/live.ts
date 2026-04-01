import { PgClient } from "@effect/sql-pg";
import * as PgDrizzle from "drizzle-orm/effect-postgres";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";
import { types } from "pg";
import { serverConfig } from "@/server/config/server-config";
import { relations } from "./relations";

const databaseUrl = new URL(serverConfig.DATABASE_URL);

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

const dbEffect = PgDrizzle.make({ relations }).pipe(Effect.provide(PgDrizzle.DefaultServices));

export type Database = Effect.Effect.Success<typeof dbEffect>;

export class DB extends Context.Tag("DB")<DB, Database>() {}

export const DbLive = Layer.effect(DB, dbEffect).pipe(Layer.provide(PgClientLive));
