import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { sessionQueryOptions } from "@/features/auth/queries";

export const Route = createFileRoute("/tests/$testId")({
  loader: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions());
    if (!session?.user) {
      throw redirect({ to: "/auth" });
    }
  },
  component: TestLayout,
});

function TestLayout() {
  return <Outlet />;
}
