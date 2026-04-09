import { isServer } from "./is-server";

export const POSTHOG_ANONYMOUS_ID = "anonymous";
export const POSTHOG_SESSION_ID_HEADER = "X-PostHog-Session-Id";
export const POSTHOG_DISTINCT_ID_HEADER = "X-PostHog-Distinct-Id";

export function getPostHogHeaders(): Record<string, string> {
  if (isServer) {
    return {};
  }

  const headers: Record<string, string> = {};

  const sessionId = window.posthog?.get_session_id?.();
  if (sessionId) headers[POSTHOG_SESSION_ID_HEADER] = sessionId;

  const distinctId = window.posthog?.get_distinct_id?.();
  if (distinctId) headers[POSTHOG_DISTINCT_ID_HEADER] = distinctId;

  return headers;
}
