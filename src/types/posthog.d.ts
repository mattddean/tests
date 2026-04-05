declare global {
  interface Window {
    __posthog_initialized?: boolean;
    posthog?: {
      get_distinct_id?: () => string | null;
      get_session_id?: () => string | null;
      init?: (...args: Array<unknown>) => void;
    };
  }

  interface ImportMetaEnv {
    readonly VITE_POSTHOG_HOST?: string;
    readonly VITE_POSTHOG_PROJECT_TOKEN?: string;
    readonly VITE_POSTHOG_ENABLE_RECORDING_CONSOLE_LOG?: string;
  }
}

export {};
