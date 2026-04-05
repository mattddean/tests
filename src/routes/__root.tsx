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
