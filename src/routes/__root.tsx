import { Outlet, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { Provider } from "@/integrations/tanstack-query/root-provider";
import TanStackQueryDevtools from "@/integrations/tanstack-query/devtools";
import { sessionQueryOptions } from "@/features/auth/queries";
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

  return (
    <SiteShell session={session}>
      <Outlet />
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
    </SiteShell>
  );
}
