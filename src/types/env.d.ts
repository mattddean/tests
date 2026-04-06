interface Window {
  posthog?: {
    capture: (event: string, properties?: Record<string, unknown>) => void;
    captureException: (error: unknown, properties?: Record<string, unknown>) => void;
    identify: (distinctId: string, properties?: Record<string, unknown>) => void;
    reset: () => void;
    get_session_id: () => string | null;
    get_distinct_id: () => string | null;
  };
}

declare namespace App {
  interface Locals {
    // Add custom locals here
  }
}
