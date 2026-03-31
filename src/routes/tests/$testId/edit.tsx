import { useCallback, useMemo, useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { CircleCheckBig, Eye, Send } from "lucide-react";
import { FieldLabel } from "@/components/field-label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input as TextInput } from "@/components/ui/input";
import { SectionHeading, SurfaceMeta } from "@/components/ui";
import { sessionQueryOptions } from "@/features/auth/queries";
import { testEditorQueryOptions, testsKeys } from "@/features/tests/queries";
import {
  addChoiceAction,
  addEditorAction,
  addQuestionAction,
  deleteChoiceAction,
  deleteQuestionAction,
  publishTestAction,
  removeEditorAction,
  reorderChoicesAction,
  reorderQuestionsAction,
  shareTestAction,
  updateChoiceAction,
  updateQuestionAction,
  updateTestMetaAction,
} from "@/features/tests/server";
import { TestDocument } from "@/features/tests/components/test-document";

export const Route = createFileRoute("/tests/$testId/edit")({
  loader: async ({ context, params }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions());
    if (!session?.user) {
      throw redirect({ to: "/auth" });
    }
    await context.queryClient.ensureQueryData(testEditorQueryOptions(params.testId));
  },
  component: TestEditorPage,
});

function TestEditorPage() {
  const { testId } = Route.useParams();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(testEditorQueryOptions(testId));
  const [saveLabel, setSaveLabel] = useState("Ready");
  const [saveTone, setSaveTone] = useState<"neutral" | "accent" | "success" | "warning">("neutral");

  const invalidate = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: testsKeys.editor(testId) }),
      queryClient.invalidateQueries({ queryKey: testsKeys.take(testId) }),
      queryClient.invalidateQueries({ queryKey: testsKeys.dashboard() }),
      queryClient.invalidateQueries({ queryKey: testsKeys.all }),
    ]);
  }, [queryClient, testId]);

  const withSaveState = async (callback: () => Promise<void>) => {
    setSaveLabel("Saving");
    setSaveTone("accent");
    try {
      await callback();
      setSaveLabel("Saved");
      setSaveTone("success");
    } catch (error) {
      setSaveLabel(error instanceof Error ? error.message : "Failed");
      setSaveTone("warning");
    }
  };

  const metaMutation = useMutation({
    mutationFn: updateTestMetaAction,
    onSuccess: async () => invalidate(),
  });
  const addEditorMutation = useMutation({
    mutationFn: addEditorAction,
    onSuccess: async () => invalidate(),
  });
  const shareTestMutation = useMutation({
    mutationFn: shareTestAction,
    onSuccess: async () => invalidate(),
  });
  const removeEditorMutation = useMutation({
    mutationFn: removeEditorAction,
    onSuccess: async () => invalidate(),
  });
  const publishMutation = useMutation({
    mutationFn: publishTestAction,
    onSuccess: async () => invalidate(),
  });

  const metaForm = useForm({
    defaultValues: {
      title: data.test.title,
      description: data.test.description ?? "",
    },
    onSubmit: async ({ value }) => {
      await withSaveState(async () => {
        await metaMutation.mutateAsync({
          data: {
            testId,
            title: value.title,
            description: value.description || null,
          },
        });
      });
    },
  });

  const addEditorForm = useForm({
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value, formApi }) => {
      await withSaveState(async () => {
        await addEditorMutation.mutateAsync({
          data: {
            testId,
            email: value.email,
          },
        });
      });
      formApi.reset();
    },
  });

  const shareTestForm = useForm({
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value, formApi }) => {
      await withSaveState(async () => {
        await shareTestMutation.mutateAsync({
          data: {
            testId,
            email: value.email,
          },
        });
      });
      formApi.reset();
    },
  });

  const documentHandlers = useMemo(
    () => ({
      onTitleSave: async (value: string) =>
        withSaveState(async () => {
          await metaMutation.mutateAsync({
            data: {
              testId,
              title: value || "Untitled test",
              description: data.test.description ?? "",
            },
          });
        }),
      onDescriptionSave: async (value: string) =>
        withSaveState(async () => {
          await metaMutation.mutateAsync({
            data: {
              testId,
              title: data.test.title,
              description: value || null,
            },
          });
        }),
      onQuestionPromptSave: async (questionId: string, value: string) =>
        withSaveState(async () => {
          await updateQuestionAction({
            data: { questionId, prompt: value || "Untitled question" },
          });
          await invalidate();
        }),
      onQuestionDescriptionSave: async (questionId: string, value: string) =>
        withSaveState(async () => {
          await updateQuestionAction({ data: { questionId, description: value || null } });
          await invalidate();
        }),
      onQuestionRequiredToggle: async (questionId: string, value: boolean) =>
        withSaveState(async () => {
          await updateQuestionAction({ data: { questionId, required: value } });
          await invalidate();
        }),
      onQuestionAdd: async (afterQuestionId?: string | null) =>
        withSaveState(async () => {
          await addQuestionAction({ data: { testId, afterQuestionId } });
          await invalidate();
        }),
      onQuestionDelete: async (questionId: string) =>
        withSaveState(async () => {
          await deleteQuestionAction({ data: { questionId } });
          await invalidate();
        }),
      onQuestionReorder: async (questionIds: Array<string>) =>
        withSaveState(async () => {
          await reorderQuestionsAction({ data: { testId, questionIds } });
          await invalidate();
        }),
      onChoiceSave: async (choiceId: string, value: string) =>
        withSaveState(async () => {
          await updateChoiceAction({ data: { choiceId, label: value || "Untitled choice" } });
          await invalidate();
        }),
      onChoiceAdd: async (questionId: string, afterChoiceId?: string | null) =>
        withSaveState(async () => {
          await addChoiceAction({ data: { questionId, afterChoiceId } });
          await invalidate();
        }),
      onChoiceDelete: async (choiceId: string) =>
        withSaveState(async () => {
          await deleteChoiceAction({ data: { choiceId } });
          await invalidate();
        }),
      onChoiceReorder: async (questionId: string, choiceIds: Array<string>) =>
        withSaveState(async () => {
          await reorderChoicesAction({ data: { questionId, choiceIds } });
          await invalidate();
        }),
    }),
    [data.test.description, data.test.title, invalidate, metaMutation, testId],
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Editor"
          title="Shape the document directly."
          description="The live reader view and the editor view share the same structure. Hover reveals tools, click turns text into editing, and reorder actions stay anchored to the content."
          actions={
            <>
              <Link
                to="/tests/$testId"
                params={{ testId }}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--panel-solid)] px-4 text-sm font-medium text-[color:var(--foreground)] hover:bg-white hover:text-[color:var(--foreground)]"
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Link>
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
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--panel-solid)] px-4 text-sm font-medium text-[color:var(--foreground)] hover:bg-white hover:text-[color:var(--foreground)]"
              >
                Responses
              </Link>
            </>
          }
        />

        <TestDocument
          mode="edit"
          editable
          title={data.test.title}
          description={data.test.description}
          status={data.test.status}
          questions={data.questions}
          saveState={{ label: saveLabel, tone: saveTone }}
          handlers={documentHandlers}
        />
      </div>

      <div className="space-y-4">
        <Card className="sticky top-24 space-y-5 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold tracking-[0.2em] text-[color:var(--muted)] uppercase">
              Settings
            </p>
            <CircleCheckBig className="h-4 w-4 text-[color:var(--accent)]" />
          </div>

          <div className="space-y-4">
            <SurfaceMeta label="Status" value={data.test.status} />
            <SurfaceMeta label="Updated" value={new Date(data.test.updatedAt).toLocaleString()} />
            <SurfaceMeta label="Responses" value={data.responseCount} />
          </div>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void metaForm.handleSubmit();
            }}
          >
            <metaForm.Field name="title">
              {(field) => (
                <div className="space-y-2">
                  <FieldLabel label="Title" />
                  <TextInput
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </metaForm.Field>
            <metaForm.Field name="description">
              {(field) => (
                <div className="space-y-2">
                  <FieldLabel label="Description" />
                  <textarea
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    rows={4}
                    className="w-full rounded-2xl border border-[color:var(--border-strong)] bg-white px-4 py-3 text-sm outline-none focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[color:var(--accent-faint)]"
                  />
                </div>
              )}
            </metaForm.Field>
            <Button type="submit" variant="secondary" className="w-full">
              Save metadata
            </Button>
          </form>

          {data.viewerPermission === "owner" ? (
            <>
              <div className="h-px bg-[color:var(--border)]" />
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void addEditorForm.handleSubmit();
                }}
              >
                <addEditorForm.Field name="email">
                  {(field) => (
                    <div className="space-y-2">
                      <FieldLabel
                        label="Invite editor"
                        helper="Invite an existing account by email."
                      />
                      <TextInput
                        type="email"
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="editor@example.com"
                      />
                    </div>
                  )}
                </addEditorForm.Field>
                <Button type="submit" variant="secondary" className="w-full">
                  Send invite
                </Button>
              </form>

              <div className="space-y-3">
                <FieldLabel label="Collaborators" />
                {data.collaborators.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--border)] bg-white/70 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{person.name}</p>
                      <p className="text-xs text-[color:var(--muted)]">{person.email}</p>
                    </div>
                    {person.role === "owner" ? (
                      <span className="text-xs tracking-[0.18em] text-[color:var(--muted)] uppercase">
                        owner
                      </span>
                    ) : (
                      <button
                        className="text-xs tracking-[0.18em] text-red-600 uppercase"
                        onClick={() =>
                          void removeEditorMutation.mutateAsync({
                            data: {
                              testId,
                              userId: person.id,
                            },
                          })
                        }
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="h-px bg-[color:var(--border)]" />
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void shareTestForm.handleSubmit();
                }}
              >
                <shareTestForm.Field name="email">
                  {(field) => (
                    <div className="space-y-2">
                      <FieldLabel
                        label="Share with test taker"
                        helper={
                          data.test.status === "published"
                            ? "Send a private test link tied to the taker's email."
                            : "Publish first, then send private test links."
                        }
                      />
                      <TextInput
                        type="email"
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="candidate@example.com"
                        disabled={data.test.status !== "published"}
                      />
                    </div>
                  )}
                </shareTestForm.Field>
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full"
                  disabled={data.test.status !== "published"}
                >
                  Email invitation
                </Button>
              </form>

              <div className="space-y-3">
                <FieldLabel label="Taker invites" />
                {data.takerInvites.length === 0 ? (
                  <p className="text-sm text-[color:var(--muted)]">
                    No pending taker links have been sent yet.
                  </p>
                ) : (
                  data.takerInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="rounded-2xl border border-[color:var(--border)] bg-white/70 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{invite.email}</p>
                          <p className="text-xs text-[color:var(--muted)]">
                            Sent {new Date(invite.lastSentAt).toLocaleString()}
                          </p>
                        </div>
                        <span className="text-xs tracking-[0.18em] text-[color:var(--muted)] uppercase">
                          pending
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Button
                className="w-full"
                disabled={data.test.status === "published"}
                onClick={() =>
                  void withSaveState(async () => {
                    await publishMutation.mutateAsync({ data: { testId } });
                    await invalidate();
                  })
                }
              >
                <Send className="mr-2 h-4 w-4" />
                {data.test.status === "published" ? "Published" : "Publish test"}
              </Button>
            </>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
