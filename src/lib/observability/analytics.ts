import { env } from "@/lib/env";

export function getAnalyticsConfig() {
  if (env.VITE_POSTHOG_PROJECT_TOKEN && env.VITE_POSTHOG_HOST) {
    return {
      VITE_POSTHOG_PROJECT_TOKEN: env.VITE_POSTHOG_PROJECT_TOKEN,
      VITE_POSTHOG_HOST: env.VITE_POSTHOG_HOST,
    };
  }
}

export function enableAds(): boolean {
  // For now, ads follow the same rules as analytics
  return !!getAnalyticsConfig();
}
