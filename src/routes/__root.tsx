import type { QueryClient } from "@tanstack/react-query";

import { TanStackDevtools } from "@tanstack/react-devtools";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { SiteShell } from "@/components/site-shell";
import { sessionQueryOptions } from "@/features/auth/queries";
import TanStackQueryDevtools from "@/integrations/tanstack-query/devtools";
import { Provider } from "@/integrations/tanstack-query/root-provider";

import appCss from "../styles.css?url";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Field Notes" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(sessionQueryOptions());
  },
  component: RootComponent,
  notFoundComponent: () => <div className="p-10 text-center">Not Found</div>,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <html lang="en">
      <head>
        <PostHogInitScript />
        <HeadContent />
      </head>
      <body>
        <Provider queryClient={queryClient}>
          <AppFrame />
        </Provider>
        <Scripts />
      </body>
    </html>
  );
}

function PostHogInitScript() {
  const host = import.meta.env.VITE_POSTHOG_HOST;
  const projectToken = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN;

  if (!host || !projectToken) {
    return null;
  }

  const script = `
if (!window.__posthog_initialized) {
  window.__posthog_initialized = true;
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  window.posthog?.init?.(${JSON.stringify(projectToken)}, {
    api_host: ${JSON.stringify(host)},
    defaults: "2026-01-30",
    capture_pageview: "history_change",
    capture_exceptions: {
      capture_console_errors: false
    },
    enable_recording_console_log: ${JSON.stringify(
      (import.meta.env.VITE_POSTHOG_ENABLE_RECORDING_CONSOLE_LOG ?? "false") === "true",
    )}
  });
}
`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

function AppFrame() {
  const { data: session } = useSuspenseQuery(sessionQueryOptions());
  const shouldShowDevtools = import.meta.env.DEV && import.meta.env.VITE_SHOW_DEVTOOLS === "true";

  return (
    <SiteShell session={session}>
      <Outlet />
      {shouldShowDevtools ? (
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "TanStack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
      ) : null}
    </SiteShell>
  );
}
