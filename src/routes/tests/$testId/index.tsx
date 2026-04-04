import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Edit3 } from "lucide-react";
import { useMemo, useState } from "react";

import { SectionHeading } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { parseTakeTestSearch } from "@/domains/tests/schema";
import { sessionQueryOptions } from "@/features/auth/queries";
import { TestDocument } from "@/features/tests/components/test-document";
import { testTakeQueryOptions, testsKeys } from "@/features/tests/queries";
import { saveAnswerAction, submitResponseAction } from "@/features/tests/server";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/tests/$testId/")({
  validateSearch: parseTakeTestSearch,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(sessionQueryOptions());
  },
  component: TestTakePage,
});

function TestTakePage() {
  const { testId } = Route.useParams();
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  const sessionQuery = useQuery(sessionQueryOptions());
  const takeQuery = useQuery({
    ...testTakeQueryOptions(testId),
    enabled: !!sessionQuery.data?.user,
    retry: false,
  });

  const data = takeQuery.data;
  const [saveState, setSaveState] = useState<{
    label: string;
    tone: "neutral" | "accent" | "success" | "warning";
  }>({
    label: "Ready",
    tone: "neutral",
  });

  const redirectUrl = `/tests/${testId}${search.inviteEmail ? `?inviteEmail=${encodeURIComponent(search.inviteEmail)}` : ""}`;

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

  if (sessionQuery.isPending) {
    return <Card className="px-5 py-4 text-sm text-[color:var(--muted)]">Loading test…</Card>;
  }

  if (!sessionQuery.data?.user) {
    return (
      <TestAccessGate
        title={search.inviteEmail ? "You were invited to take this test." : "This test may exist."}
        description={
          search.inviteEmail
            ? `Sign in or create an account with ${search.inviteEmail} to open the test.`
            : "You may need to sign in or create an account before the test becomes visible."
        }
        redirectUrl={redirectUrl}
        inviteEmail={search.inviteEmail}
      />
    );
  }

  if (takeQuery.isPending || !data) {
    return <Card className="px-5 py-4 text-sm text-[color:var(--muted)]">Loading test…</Card>;
  }

  if (takeQuery.isError) {
    const mismatchedInvite =
      search.inviteEmail &&
      sessionQuery.data.user.email.toLowerCase() !== search.inviteEmail.toLowerCase();

    return (
      <TestAccessGate
        title={
          mismatchedInvite
            ? "This invite belongs to a different email address."
            : "This test may exist."
        }
        description={
          mismatchedInvite
            ? `You're signed in as ${sessionQuery.data.user.email}, but this invite is for ${search.inviteEmail}.`
            : "You may need to sign in with a different account, or the owner may not have shared this test with you yet."
        }
        redirectUrl={redirectUrl}
        inviteEmail={search.inviteEmail}
        signedInEmail={sessionQuery.data.user.email}
      />
    );
  }

  const resolvedSaveState = data.response.lastAutosavedAt
    ? saveState.label === "Ready"
      ? { label: "Saved draft", tone: "success" as const }
      : saveState
    : saveState;

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
          saveState={resolvedSaveState}
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

function TestAccessGate({
  title,
  description,
  redirectUrl,
  inviteEmail,
  signedInEmail,
}: {
  title: string;
  description: string;
  redirectUrl: string;
  inviteEmail?: string;
  signedInEmail?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SectionHeading eyebrow="Test Access" title={title} description={description} />
      <Card className="space-y-4 p-6">
        {signedInEmail ? (
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            Sign out first if you need to continue with {inviteEmail ?? "another account"}.
          </p>
        ) : (
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            Continue to sign in or create an account and you&apos;ll be sent straight back here.
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          {signedInEmail ? (
            <button
              type="button"
              onClick={() => {
                void authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      window.location.assign(
                        `/auth?redirect=${encodeURIComponent(redirectUrl)}${inviteEmail ? `&email=${encodeURIComponent(inviteEmail)}` : ""}`,
                      );
                    },
                  },
                });
              }}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--foreground)] px-4 text-sm font-medium text-white"
            >
              Switch account
            </button>
          ) : (
            <>
              <Link
                to="/auth"
                search={{
                  redirect: redirectUrl,
                  email: inviteEmail,
                }}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--foreground)] px-4 text-sm font-medium text-white"
              >
                Sign in
              </Link>
              <Link
                to="/auth"
                search={{
                  redirect: redirectUrl,
                  email: inviteEmail,
                }}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--panel-solid)] px-4 text-sm font-medium text-[color:var(--foreground)]"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
