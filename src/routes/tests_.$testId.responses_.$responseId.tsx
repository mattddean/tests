import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, SectionHeading } from "@/components/ui";
import { sessionQueryOptions } from "@/features/auth/queries";
import { responseDetailQueryOptions } from "@/features/tests/queries";
import { TestDocument } from "@/features/tests/components/test-document";

export const Route = createFileRoute("/tests_/$testId/responses_/$responseId")({
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

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Response Review"
        title="Inspect a completed or in-progress response in context."
        description="This view reuses the test surface and overlays the responder metadata instead of switching to a detached answer sheet."
        actions={
          <a
            href={`/tests/${testId}/responses`}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--panel-solid)] px-4 text-sm font-medium transition hover:bg-white"
          >
            Back to table
          </a>
        }
      />

      <Card className="grid gap-4 p-5 md:grid-cols-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--muted)]">
            Responder
          </p>
          <p className="mt-2 text-sm font-medium">{data.responder.name}</p>
          <p className="text-sm text-[color:var(--muted)]">{data.responder.email}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--muted)]">
            Status
          </p>
          <p className="mt-2 text-sm font-medium">{data.response.status}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--muted)]">
            Started
          </p>
          <p className="mt-2 text-sm font-medium">
            {new Date(data.response.startedAt!).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--muted)]">
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
