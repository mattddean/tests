import { createFileRoute, redirect } from "@tanstack/react-router";

import { createTest } from "@/controllers";
import { sessionQueryOptions } from "@/lib/auth/queries";
import { throwOnError } from "@/lib/server-result";

const createTestOrThrow = throwOnError(createTest);

export const Route = createFileRoute("/tests/new")({
  loader: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions());
    if (!session?.user) {
      throw redirect({ to: "/auth" });
    }

    const test = await createTestOrThrow({ data: { title: "Untitled test" } });

    throw redirect({
      to: "/tests/$testId/edit",
      params: { testId: test.id },
      replace: true,
    });
  },
  component: () => null,
});
