import { useEffect } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { sessionQueryOptions } from "@/features/auth/queries";
import { createTest } from "@/features/tests/server";
import { LoadingBlock } from "@/components/ui";

export const Route = createFileRoute("/tests/new")({
  loader: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions());
    if (!session?.user) {
      throw redirect({ to: "/auth" });
    }
  },
  component: NewTestPage,
});

function NewTestPage() {
  const mutation = useMutation({
    mutationFn: () => createTest({ data: { title: "Untitled test" } }),
  });

  useEffect(() => {
    if (mutation.isIdle) {
      mutation.mutate();
    }
  }, [mutation]);

  useEffect(() => {
    if (mutation.data?.id) {
      window.location.href = `/tests/${mutation.data.id}/edit`;
    }
  }, [mutation.data]);

  return <LoadingBlock label="Creating a new draft…" />;
}
