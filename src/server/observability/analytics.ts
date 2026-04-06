export function getAnalyticsConfig() {
  const host = String(
    process.env.VITE_POSTHOG_HOST ?? import.meta.env.VITE_POSTHOG_HOST ?? "",
  ).trim();
  const projectToken = String(
    process.env.VITE_POSTHOG_PROJECT_TOKEN ?? import.meta.env.VITE_POSTHOG_PROJECT_TOKEN ?? "",
  ).trim();

  if (!host || !projectToken) {
    return undefined;
  }

  return {
    PUBLIC_POSTHOG_HOST: host,
    PUBLIC_POSTHOG_PROJECT_TOKEN: projectToken,
  };
}
