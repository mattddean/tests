import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ButtonLink } from "@/components/button-link";
import { Card } from "@/components/ui/card";
import { EmptyState, SectionHeading, StatusPill } from "@/components/ui";
import { sessionQueryOptions } from "@/features/auth/queries";
import { myResponsesQueryOptions } from "@/features/tests/queries";

export const Route = createFileRoute("/me/responses")({
  loader: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions());
    if (!session?.user) {
      throw redirect({ to: "/auth" });
    }
    await context.queryClient.ensureQueryData(myResponsesQueryOptions());
  },
  component: MyResponsesPage,
});

function MyResponsesPage() {
  const { data } = useSuspenseQuery(myResponsesQueryOptions());

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="My Responses"
        title="Drafts you can resume and submissions you’ve already sent."
        description="Responses are always tied to your account. Drafts stay editable until you submit, after which the document locks into review mode."
        actions={
          <ButtonLink to="/tests" variant="secondary">
            Browse tests
          </ButtonLink>
        }
      />

      {data.length === 0 ? (
        <EmptyState
          title="No responses yet"
          description="Open a published test to begin a response draft."
        />
      ) : (
        <div className="space-y-3">
          {data.map((item) => (
            <Card key={item.id} className="px-5 py-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold tracking-tight">{item.testTitle}</h2>
                    <StatusPill tone={item.status === "submitted" ? "success" : "accent"}>
                      {item.status}
                    </StatusPill>
                  </div>
                  <p className="text-sm text-[color:var(--muted)]">
                    Updated {new Date(item.updatedAt).toLocaleString()}
                    {item.submittedAt
                      ? ` · Submitted ${new Date(item.submittedAt).toLocaleString()}`
                      : ""}
                  </p>
                </div>
                <Link
                  to="/tests/$testId"
                  params={{ testId: item.testId }}
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--panel-solid)] px-4 text-sm font-medium text-[color:var(--foreground)] hover:bg-white hover:text-[color:var(--foreground)]"
                >
                  {item.status === "submitted" ? "View response" : "Resume draft"}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
