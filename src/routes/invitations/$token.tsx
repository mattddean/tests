import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui";
import { sessionQueryOptions } from "@/features/auth/queries";
import { acceptTestInviteAction } from "@/features/tests/server";

export const Route = createFileRoute("/invitations/$token")({
  loader: async ({ context, params }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions());

    if (!session?.user) {
      throw redirect({
        to: "/auth",
        search: {
          redirect: `/invitations/${params.token}`,
        },
      });
    }

    try {
      const result = await acceptTestInviteAction({
        data: { token: params.token },
      });

      throw redirect({
        to: "/tests/$testId",
        params: { testId: result.testId },
      });
    } catch (error) {
      return {
        message: error instanceof Error ? error.message : "This invitation could not be opened.",
      };
    }
  },
  component: InvitationStatusPage,
});

function InvitationStatusPage() {
  const result = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SectionHeading
        eyebrow="Invitation"
        title="This test link could not be opened."
        description={result.message}
      />

      <Card className="space-y-4 p-6">
        <p className="text-sm leading-6 text-[color:var(--muted)]">
          Ask the test owner to send a fresh invitation if you still need access.
        </p>
        <Link
          to="/tests"
          search={{ scope: "shared" }}
          className="text-sm text-[color:var(--accent-strong)]"
        >
          Back to shared tests
        </Link>
      </Card>
    </div>
  );
}
