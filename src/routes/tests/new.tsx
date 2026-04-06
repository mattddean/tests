import { createFileRoute, redirect } from "@tanstack/react-router";

import { sessionQueryOptions } from "@/features/auth/queries";
import { createTest } from "@/features/tests/server";
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
