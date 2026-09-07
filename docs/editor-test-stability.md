# Editor request and test stability

## Failure and repair

The browser component test used a page-wide text locator for `AblationTable`.
An automatically restored article could contain that name in its syntax-highlighted
MDX, so the test inspected the article instead of the collapsed component library.
It now creates a known draft, deliberately inserts both `AblationTable` and
`Algorithm` into the body, and scopes card lookups to the Component Library.

Separately, `middleware.tsx` statically imported `posts/manifest.json`. Editor
mutations regenerate that index, rebuilding middleware while authoring requests
are in flight. On the pinned Next.js 15.5.21/Turbopack development server, a local
HTTP probe reproduced HTML 404 responses across `/api/editor`, `/api/editor/list`,
`/api/posts` and `/editor` (4 failures in 47 requests). This was not a save conflict
response or a selector failure.

Middleware now uses the Node.js runtime supported by Next.js 15.5 and reads the
index from disk only for article access checks. The same probe completed all 75
requests with no failures after the change, with only the initial middleware
compilation. This is a bounded regression result, not a proof that every upstream
hot-reload failure is impossible. Turbopack, atomic file writes, mutation locking,
version preconditions and API rate limits are unchanged. There are no automatic
retries of mutations.

## Preserved boundaries

- Published article access is unchanged. Drafts are local-only; archived or
  unknown articles remain unavailable.
- A missing or malformed index fails article checks closed with an uncached 503.
  Editor access checks do not read the article index.
- Production editor routes remain 404, and local Host/Origin checks remain active.
- The runtime reads `posts/manifest.json` from the application working directory.
  The existing standalone assembler includes a published-only copy; deployment
  smoke tests continue to exercise the assembled artifact.
- No new dependency, article rewrite, URL change or editor UI redesign is needed.

## Regression gates

`tests/middleware-index.test.ts` checks live index changes, visibility policies,
missing/malformed indexes and index-independent editor access.
`tests/e2e/editor-index-stability.spec.ts` interleaves 12 versioned updates with
editor/list/public API reads, then verifies deletion. It does not sleep or retry
until success, and rejects an HTML response where JSON is required.

The editor CI job starts the complete Playwright suite three separate times with
`--retries=0`. Every run must pass; an error stops the job and fails `release-gate`.
Each invocation starts a fresh authoring process (including fresh rate-limit
state), rather than increasing rate limits to accommodate repeated tests.
Reports, traces and server output are retained separately for each pass under
`playwright-report/`, `test-results/` and `editor-logs/`.

For one local run with the repository's supported Node.js and Playwright browser:

```bash
pnpm test:e2e --retries=0
```

Do not run concurrent authoring servers or content commands against the same
checkout. This remains a single-process local writing tool; see
[save safety](editor-save-safety.md) and [release safety](release-safety.md).
