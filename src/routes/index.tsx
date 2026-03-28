import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, FilePenLine, LayoutList, Rows3, Sparkles } from "lucide-react";
import { dashboardQueryOptions } from "@/features/tests/queries";
import { sessionQueryOptions } from "@/features/auth/queries";
import { ButtonLink, Card, EmptyState, SectionHeading, StatusPill } from "@/components/ui";
import { TestListRow } from "@/components/site-shell";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions());

    if (session?.user) {
      await context.queryClient.ensureQueryData(dashboardQueryOptions());
    }
  },
  component: HomePage,
});

function HomePage() {
  const { data: session } = useSuspenseQuery(sessionQueryOptions());

  if (!session?.user) {
    return <MarketingLanding />;
  }

  return <WorkspaceHome />;
}

function WorkspaceHome() {
  const { data } = useSuspenseQuery(dashboardQueryOptions());

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Workspace"
        title="Build tests that read beautifully and review cleanly."
        description="Create drafts, invite editors, publish when ready, and review every response from the same document surface."
        actions={
          <>
            <ButtonLink to="/tests/new" preload={false}>
              Create test
            </ButtonLink>
            <ButtonLink to="/tests" tone="secondary">
              Browse library
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
        <Card className="overflow-hidden p-6 md:p-8">
          <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              <StatusPill tone="accent">Creator flow</StatusPill>
              <h2 className="text-3xl font-semibold tracking-[-0.04em]">
                One surface for writing, taking, and reviewing.
              </h2>
              <p className="max-w-[58ch] text-sm leading-7 text-[color:var(--muted)] md:text-base">
                The editor uses the same document layout as the live test. Hover reveals controls,
                click turns text into direct editing, and responses reopen inside that same reading
                frame.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <MetricCard
                  icon={<FilePenLine className="h-4 w-4" />}
                  label="Draft tests"
                  value={`${data.drafts.length}`}
                />
                <MetricCard
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  label="Published"
                  value={`${data.published.length}`}
                />
                <MetricCard
                  icon={<Rows3 className="h-4 w-4" />}
                  label="Recent responses"
                  value={`${data.recentResponses.length}`}
                />
              </div>
            </div>
            <div className="space-y-3 rounded-[1.8rem] border border-[color:var(--border)] bg-[color:var(--panel-solid)] p-5">
              <PreviewStrip
                icon={<LayoutList className="h-4 w-4" />}
                title="Draft"
                text="Shape questions inline, reorder with drag handles, and invite collaborators by email."
              />
              <PreviewStrip
                icon={<Sparkles className="h-4 w-4" />}
                title="Take"
                text="Responses save as the reader works, with a clean final submit action when the draft is ready."
              />
              <PreviewStrip
                icon={<CheckCircle2 className="h-4 w-4" />}
                title="Review"
                text="TanStack Table lists every submission, and row click opens the same document with answers visible."
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 md:p-8">
          <h3 className="text-sm tracking-[0.26em] text-[color:var(--muted)] uppercase">
            Recent Responses
          </h3>
          <div className="mt-5 space-y-3">
            {data.recentResponses.length === 0 ? (
              <EmptyState
                title="No responses yet"
                description="Published tests will surface draft and submitted responses here."
              />
            ) : (
              data.recentResponses.map((response) => (
                <Link
                  key={response.id}
                  to="/tests/$testId"
                  params={{ testId: response.testId }}
                  className="block rounded-[1.5rem] border border-[color:var(--border)] bg-white/70 px-4 py-4 transition hover:border-[color:var(--border-strong)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium tracking-tight">{response.testTitle}</p>
                      <p className="mt-1 text-xs tracking-[0.18em] text-[color:var(--muted)] uppercase">
                        {response.status}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[color:var(--muted)]" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Drafts"
          title="Continue the work that is still in motion."
          actions={
            <ButtonLink to="/tests" tone="ghost">
              View all tests
            </ButtonLink>
          }
        />
        <div className="space-y-3">
          {data.drafts.length === 0 ? (
            <EmptyState
              title="No drafts yet"
              description="Create a new test and start building the first document."
              action={
                <ButtonLink to="/tests/new" preload={false}>
                  Create test
                </ButtonLink>
              }
            />
          ) : (
            data.drafts.map((item) => (
              <TestListRow
                key={item.id}
                title={item.title}
                description={item.description}
                status={item.status}
                testId={item.id}
                updatedAt={item.updatedAt}
                editorCount={item.editorCount}
                responseCount={item.responseCount}
                canEdit
                canViewResponses
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function MarketingLanding() {
  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-8 md:p-10">
          <p className="text-[11px] tracking-[0.28em] text-[color:var(--muted)] uppercase">
            Test Builder
          </p>
          <h1 className="mt-5 max-w-[12ch] text-5xl font-semibold tracking-[-0.06em] md:text-7xl">
            Write tests like documents, not admin forms.
          </h1>
          <p className="mt-5 max-w-[60ch] text-base leading-7 text-[color:var(--muted)]">
            Sign in, assemble multiple-choice tests with a direct inline editor, publish when the
            draft feels right, and review every response from the same document surface.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/auth">Sign in to start</ButtonLink>
            <ButtonLink to="/auth" tone="secondary">
              Create account
            </ButtonLink>
          </div>
        </Card>

        <Card className="grid gap-4 p-6 md:grid-cols-2 md:p-8">
          <FeatureCard
            icon={<FilePenLine className="h-5 w-5" />}
            title="Direct editing"
            text="Click straight into a title, prompt, or answer choice and edit it in place."
          />
          <FeatureCard
            icon={<Rows3 className="h-5 w-5" />}
            title="Shared surface"
            text="The editor and taker flows use the same layout, so the live experience stays honest."
          />
          <FeatureCard
            icon={<Sparkles className="h-5 w-5" />}
            title="Autosaved drafts"
            text="Takers can leave and return without losing progress before final submission."
          />
          <FeatureCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="Response review"
            text="Open any response from a table and inspect the answers in the original test frame."
          />
        </Card>
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-[color:var(--border)] bg-white/70 p-4">
      <div className="flex items-center gap-2 text-[color:var(--accent-strong)]">{icon}</div>
      <p className="mt-6 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs tracking-[0.2em] text-[color:var(--muted)] uppercase">{label}</p>
    </div>
  );
}

function PreviewStrip({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white/80 p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="text-[color:var(--accent-strong)]">{icon}</span>
        {title}
      </div>
      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{text}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-[color:var(--border)] bg-white/70 p-5">
      <div className="text-[color:var(--accent-strong)]">{icon}</div>
      <h2 className="mt-4 text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{text}</p>
    </div>
  );
}
