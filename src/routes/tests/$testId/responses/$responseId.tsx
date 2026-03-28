import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, SectionHeading } from "@/components/ui";
import { sessionQueryOptions } from "@/features/auth/queries";
import { responseDetailQueryOptions } from "@/features/tests/queries";
import { TestDocument } from "@/features/tests/components/test-document";

export const Route = createFileRoute("/tests/$testId/responses/$responseId")({
  loader: async ({ context, params }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions());
    if (!session?.user) {
      throw redirect({ to: "/auth" });
    }
    await context.queryClient.ensureQueryData(
      responseDetailQueryOptions(params.testId, params.responseId),
    );
  },
  component: ResponseReviewPage,
});

function ResponseReviewPage() {
  const { testId, responseId } = Route.useParams();
  const { data } = useSuspenseQuery(responseDetailQueryOptions(testId, responseId));
  const startedAt = data.response.startedAt
    ? new Date(data.response.startedAt).toLocaleString()
    : "Not started";

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Response Review"
        title="Inspect a completed or in-progress response in context."
        description="This view reuses the test surface and overlays the responder metadata instead of switching to a detached answer sheet."
        actions={
          <Link
            to="/tests/$testId/responses"
            params={{ testId }}
            search={{
              page: 1,
              query: "",
              status: "all",
              sortBy: "submittedAt",
              direction: "desc",
            }}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--panel-solid)] px-4 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-white hover:text-[color:var(--foreground)]"
          >
            Back to table
          </Link>
        }
      />

      <Card className="grid gap-4 p-5 md:grid-cols-4">
        <div>
          <p className="text-[11px] tracking-[0.24em] text-[color:var(--muted)] uppercase">
            Responder
          </p>
          <p className="mt-2 text-sm font-medium">{data.responder.name}</p>
          <p className="text-sm text-[color:var(--muted)]">{data.responder.email}</p>
        </div>
        <div>
          <p className="text-[11px] tracking-[0.24em] text-[color:var(--muted)] uppercase">
            Status
          </p>
          <p className="mt-2 text-sm font-medium">{data.response.status}</p>
        </div>
        <div>
          <p className="text-[11px] tracking-[0.24em] text-[color:var(--muted)] uppercase">
            Started
          </p>
          <p className="mt-2 text-sm font-medium">{startedAt}</p>
        </div>
        <div>
          <p className="text-[11px] tracking-[0.24em] text-[color:var(--muted)] uppercase">
            Submitted
          </p>
          <p className="mt-2 text-sm font-medium">
            {data.response.submittedAt
              ? new Date(data.response.submittedAt).toLocaleString()
              : "Not submitted"}
          </p>
        </div>
      </Card>

      <div className="mx-auto max-w-4xl">
        <TestDocument
          mode="reviewResponse"
          title={data.test.title}
          description={data.test.description}
          status={data.test.status}
          questions={data.questions}
          response={data.response}
          saveState={{ label: data.response.status, tone: "neutral" }}
        />
      </div>
    </div>
  );
}
