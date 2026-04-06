import { serverConfig } from "@/server/config/server-config";

export function getAnalyticsConfig() {
  if (serverConfig.VITE_POSTHOG_PROJECT_TOKEN && serverConfig.VITE_POSTHOG_HOST) {
    return {
      VITE_POSTHOG_PROJECT_TOKEN: serverConfig.VITE_POSTHOG_PROJECT_TOKEN,
      VITE_POSTHOG_HOST: serverConfig.VITE_POSTHOG_HOST,
    };
  }
}

export function enableAds(): boolean {
  // For now, ads follow the same rules as analytics
  return !!getAnalyticsConfig();
}
