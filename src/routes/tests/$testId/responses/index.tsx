import { z } from "zod";
import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Card, EmptyState, SectionHeading, TextInput } from "@/components/ui";
import { sessionQueryOptions } from "@/features/auth/queries";
import { responsesTableQueryOptions } from "@/features/tests/queries";
import type { ResponseTableRow } from "@/features/tests/types";

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  query: z.string().catch(""),
  status: z.enum(["all", "draft", "submitted"]).catch("all"),
  sortBy: z.enum(["startedAt", "submittedAt"]).catch("submittedAt"),
  direction: z.enum(["asc", "desc"]).catch("desc"),
});

export const Route = createFileRoute("/tests/$testId/responses/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, params, deps }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions());
    if (!session?.user) {
      throw redirect({ to: "/auth" });
    }
    await context.queryClient.ensureQueryData(responsesTableQueryOptions(params.testId, deps));
  },
  component: ResponsesPage,
});

const columnHelper = createColumnHelper<ResponseTableRow>();

function ResponsesPage() {
  const { testId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { data } = useSuspenseQuery(responsesTableQueryOptions(testId, search));

  const columns = [
    columnHelper.accessor("responderName", {
      header: "Responder",
      cell: (info) => (
        <div>
          <p className="font-medium">{info.getValue()}</p>
          <p className="text-xs text-[color:var(--muted)]">{info.row.original.responderEmail}</p>
        </div>
      ),
    }),
    columnHelper.accessor("status", {
      header: "Status",
    }),
    columnHelper.accessor("startedAt", {
      header: "Started",
      cell: (info) => new Date(info.getValue()).toLocaleString(),
    }),
    columnHelper.accessor("submittedAt", {
      header: "Submitted",
      cell: (info) => (info.getValue() ? new Date(info.getValue()!).toLocaleString() : "Not yet"),
    }),
    columnHelper.accessor("lastAutosavedAt", {
      header: "Last save",
      cell: (info) => (info.getValue() ? new Date(info.getValue()!).toLocaleString() : "Never"),
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {},
    onStateChange: () => undefined,
    renderFallbackValue: null,
    filterFns: {},
  });

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Responses"
        title="Every draft and submission for this test."
        description="Use the table for sorting and scanning, then click into any row to reopen the original document with that responder’s selected answers."
        actions={
          <Link
            to="/tests/$testId/edit"
            params={{ testId }}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--panel-solid)] px-4 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-white hover:text-[color:var(--foreground)]"
          >
            Back to editor
          </Link>
        }
      />

      <Card className="space-y-5 p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <TextInput
            value={search.query}
            placeholder="Search by responder name or email"
            onChange={(event) =>
              void navigate({
                to: "/tests/$testId/responses",
                params: { testId },
                search: { ...search, query: event.target.value },
                replace: true,
              })
            }
          />
          <select
            value={search.status}
            onChange={(event) =>
              void navigate({
                to: "/tests/$testId/responses",
                params: { testId },
                search: {
                  ...search,
                  status: event.target.value as "all" | "draft" | "submitted",
                },
                replace: true,
              })
            }
            className="h-11 rounded-2xl border border-[color:var(--border-strong)] bg-white px-4 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
          </select>
          <select
            value={search.sortBy}
            onChange={(event) =>
              void navigate({
                to: "/tests/$testId/responses",
                params: { testId },
                search: {
                  ...search,
                  sortBy: event.target.value as "startedAt" | "submittedAt",
                },
                replace: true,
              })
            }
            className="h-11 rounded-2xl border border-[color:var(--border-strong)] bg-white px-4 text-sm"
          >
            <option value="submittedAt">Sort by submitted</option>
            <option value="startedAt">Sort by started</option>
          </select>
          <select
            value={search.direction}
            onChange={(event) =>
              void navigate({
                to: "/tests/$testId/responses",
                params: { testId },
                search: { ...search, direction: event.target.value as "asc" | "desc" },
                replace: true,
              })
            }
            className="h-11 rounded-2xl border border-[color:var(--border-strong)] bg-white px-4 text-sm"
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>

        {data.length === 0 ? (
          <EmptyState
            title="No responses yet"
            description="Published tests will start populating this table as people save drafts and submit."
          />
        ) : (
          <div className="overflow-hidden rounded-[1.8rem] border border-[color:var(--border)]">
            <table className="min-w-full divide-y divide-[color:var(--border)]">
              <thead className="bg-[color:var(--panel-solid)]">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs tracking-[0.18em] text-[color:var(--muted)] uppercase"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-[color:var(--border)] bg-white/80">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer transition hover:bg-[color:var(--panel)]"
                    onClick={() =>
                      void navigate({
                        to: "/tests/$testId/responses/$responseId",
                        params: { testId, responseId: row.original.id },
                      })
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-4 text-sm text-[color:var(--foreground)]"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
