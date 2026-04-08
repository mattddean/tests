import { createEnv } from "@t3-oss/env-core";
import { z } from "zod/v4";

import { isServer } from "./is-server";

const zStr = z.string().min(1);
const zStrOpt = zStr.optional();
const zUrl = z.url();
const zUrlOpt = z.url().optional();

const railwayEnvironmentName = import.meta.env.RAILWAY_ENVIRONMENT_NAME;
const processEnv = typeof process !== "undefined" ? process.env : undefined;
const isCi = !!processEnv?.CI;
const viteEnv = railwayEnvironmentName?.includes("pr-")
  ? "pr"
  : railwayEnvironmentName || (isCi ? "ci" : "development");
const isProduction = viteEnv === "production";

export const env = createEnv({
  isServer,
  clientPrefix: "VITE_",
  server: {
    DATABASE_URL: zStr,
    AGENTMAIL_API_KEY: zStr,
    AGENTMAIL_INBOX_ID: zStr,
    BETTER_AUTH_URL: zStr,
    BETTER_AUTH_SECRET: zStr,
  },
  client: {
    VITE_ENV: z.enum(["development", "ci", "pr", "production"]),
    VITE_POSTHOG_ENABLE_RECORDING_CONSOLE_LOG: z
      .enum(["true", "false"])
      .optional()
      .default("false"),
    VITE_POSTHOG_HOST: isProduction ? zUrl : zUrlOpt,
    VITE_POSTHOG_PROJECT_TOKEN: isProduction ? zStr : zStrOpt,
    VITE_SHOW_DEVTOOLS: z.enum(["true", "false"]).optional().default("false"),
  },
  runtimeEnv: {
    ...processEnv,
    ...import.meta.env,
    VITE_ENV: viteEnv,
  },
  emptyStringAsUndefined: true,
  skipValidation: isCi || processEnv?.npm_lifecycle_event === "lint",
});
