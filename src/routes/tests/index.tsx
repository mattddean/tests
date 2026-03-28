import { z } from "zod";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ButtonLink } from "@/components/button-link";
import { EmptyState, SectionHeading } from "@/components/ui";
import { TestListRow } from "@/components/site-shell";
import { sessionQueryOptions } from "@/features/auth/queries";
import { testsListQueryOptions } from "@/features/tests/queries";

const searchSchema = z.object({
  scope: z.enum(["drafts", "published", "shared"]).catch("drafts"),
});

export const Route = createFileRoute("/tests/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ scope: search.scope }),
  loader: async ({ context, deps }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions());
    if (!session?.user) {
      throw redirect({ to: "/auth" });
    }
    await context.queryClient.ensureQueryData(testsListQueryOptions(deps.scope));
  },
  component: TestsPage,
});

function TestsPage() {
  const search = Route.useSearch();
  const { data } = useSuspenseQuery(testsListQueryOptions(search.scope));

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Library"
        title="Every test you can shape, publish, or review."
        description="Drafts stay private, published tests start collecting responses, and shared tests surface the forms other people invited you into."
        actions={
          <ButtonLink to="/tests/new" preload={false}>
            New test
          </ButtonLink>
        }
      />

      <div className="inline-flex rounded-full border border-[color:var(--border)] bg-white/70 p-1.5">
        {[
          { value: "drafts", label: "Drafts" } as const,
          { value: "published", label: "Published" } as const,
          { value: "shared", label: "Shared with me" } as const,
        ].map((item) => (
          <Link
            key={item.value}
            to="/tests"
            search={{ scope: item.value }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              search.scope === item.value
                ? "bg-[color:var(--foreground)] text-white"
                : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {data.length === 0 ? (
          <EmptyState
            title={`No ${search.scope} tests yet`}
            description="Create a new draft, publish an existing one, or wait for another editor to share a test with you."
            action={
              search.scope !== "shared" ? (
                <ButtonLink to="/tests/new" preload={false}>
                  Create test
                </ButtonLink>
              ) : null
            }
          />
        ) : (
          data.map((item) => (
            <TestListRow
              key={item.id}
              title={item.title}
              description={item.description}
              status={item.status}
              testId={item.id}
              updatedAt={item.updatedAt}
              editorCount={item.editorCount}
              responseCount={item.responseCount}
              canEdit={item.viewerPermission !== "taker"}
              canViewResponses={item.viewerPermission !== "taker"}
            />
          ))
        )}
      </div>
    </div>
  );
}
