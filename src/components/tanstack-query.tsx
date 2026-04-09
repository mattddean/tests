import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  });

  return {
    queryClient,
  };
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export const TanStackQueryDevtools = {
  name: "Tanstack Query",
  render: <ReactQueryDevtoolsPanel />,
};
