import { useMemo, useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Edit3 } from "lucide-react";
import { Card, SectionHeading } from "@/components/ui";
import { sessionQueryOptions } from "@/features/auth/queries";
import { testTakeQueryOptions, testsKeys } from "@/features/tests/queries";
import { saveAnswerAction, submitResponseAction } from "@/features/tests/server";
import { TestDocument } from "@/features/tests/components/test-document";

export const Route = createFileRoute("/tests/$testId/")({
  loader: async ({ context, params }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions());
    if (!session?.user) {
      throw redirect({ to: "/auth" });
    }
    await context.queryClient.ensureQueryData(testTakeQueryOptions(params.testId));
  },
  component: TestTakePage,
});

function TestTakePage() {
  const { testId } = Route.useParams();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(testTakeQueryOptions(testId));
  const [saveState, setSaveState] = useState<{
    label: string;
    tone: "neutral" | "accent" | "success" | "warning";
  }>({
    label: data.response.lastAutosavedAt ? "Saved draft" : "Ready",
    tone: data.response.lastAutosavedAt ? "success" : "neutral",
  });

  const answerMutation = useMutation({
    mutationFn: saveAnswerAction,
    onMutate: () => setSaveState({ label: "Saving", tone: "accent" }),
    onSuccess: async () => {
      setSaveState({ label: "Saved draft", tone: "success" });
      await queryClient.invalidateQueries({ queryKey: testsKeys.take(testId) });
      await queryClient.invalidateQueries({ queryKey: testsKeys.myResponses() });
    },
    onError: (error) =>
      setSaveState({
        label: error instanceof Error ? error.message : "Failed to save",
        tone: "warning",
      }),
  });
  const submitMutation = useMutation({
    mutationFn: submitResponseAction,
    onMutate: () => setSaveState({ label: "Submitting", tone: "accent" }),
    onSuccess: async () => {
      setSaveState({ label: "Submitted", tone: "success" });
      await queryClient.invalidateQueries({ queryKey: testsKeys.take(testId) });
      await queryClient.invalidateQueries({ queryKey: testsKeys.dashboard() });
      await queryClient.invalidateQueries({ queryKey: testsKeys.myResponses() });
      await queryClient.invalidateQueries({ queryKey: testsKeys.all });
    },
    onError: (error) =>
      setSaveState({
        label: error instanceof Error ? error.message : "Failed to submit",
        tone: "warning",
      }),
  });

  const handlers = useMemo(
    () => ({
      onChoiceSelect: (questionId: string, choiceId: string) => {
        answerMutation.mutate({
          data: {
            testId,
            questionId,
            choiceId,
          },
        });
      },
      onSubmit: () => {
        submitMutation.mutate({
          data: {
            testId,
          },
        });
      },
    }),
    [answerMutation, submitMutation, testId],
  );

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Take Test"
        title="Read naturally. Answer directly."
        description="Selections save into your draft as you work. When every required question is covered, submit the response to lock it."
        actions={
          data.canEdit ? (
          <Link
            to="/tests/$testId/edit"
            params={{ testId }}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--panel-solid)] px-4 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-white hover:text-[color:var(--foreground)]"
          >
              <Edit3 className="mr-2 h-4 w-4" />
              Edit test
            </Link>
          ) : null
        }
      />

      {data.response.status === "submitted" ? (
        <Card className="px-5 py-4 text-sm text-[color:var(--muted)]">
          Submitted{" "}
          {data.response.submittedAt ? new Date(data.response.submittedAt).toLocaleString() : ""}
        </Card>
      ) : null}

      <div className="mx-auto max-w-4xl">
        <TestDocument
          mode="take"
          title={data.test.title}
          description={data.test.description}
          status={data.test.status}
          questions={data.questions}
          response={data.response}
          saveState={saveState}
          handlers={handlers}
        />
      </div>

      {data.canEdit ? (
        <div className="text-center text-sm text-[color:var(--muted)]">
          Editors can preview the taker experience here or return to{" "}
          <Link
            to="/tests/$testId/edit"
            params={{ testId }}
            className="text-[color:var(--accent-strong)]"
          >
            edit mode
          </Link>
          .
        </div>
      ) : null}
    </div>
  );
}
