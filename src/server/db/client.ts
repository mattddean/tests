import { drizzle } from "drizzle-orm/node-postgres";

import { serverConfig } from "@/server/config/server-config";

import { relations } from "./relations";
import * as schema from "./schema";

export const db = drizzle(serverConfig.DATABASE_URL, { schema, relations });
