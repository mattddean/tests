# AGENTS.md

## Routing Notes

- Prefer directory-shaped route files that look close to Next.js routing.
- Do not use dot-delimited route filenames such as `tests.$testId.tsx` or `tests_.$testId.responses.tsx` in this repo. Prefer directory-based routing files instead.
- In this codebase, do not default to TanStack Router underscore-based non-nested route naming when the directory structure already produces the desired standalone routes.
- Before introducing `_` route segments or route groups, inspect the generated route tree in `src/routeTree.gen.ts` and confirm they are actually required.
- With the current route setup, these directory routes already resolve as standalone root-level pages without underscore suffixes:
  - `src/routes/tests/index.tsx`
  - `src/routes/tests/new.tsx`
  - `src/routes/tests/$testId/index.tsx`
  - `src/routes/tests/$testId/edit.tsx`
  - `src/routes/tests/$testId/responses/index.tsx`
  - `src/routes/tests/$testId/responses/$responseId.tsx`
- Do not reintroduce `tests_`, `responses_`, or similar underscore route paths unless `src/routeTree.gen.ts` proves a real component-tree nesting problem exists.
- When there is disagreement about TanStack file-routing behavior, prefer the actual generated route tree and working app behavior over assumptions.

## After all changes

- Run `bun run check`
