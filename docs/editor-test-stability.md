# Editor request and test stability

## Two distinct failures

The component test used a page-wide `AblationTable` text locator. The editor's
restored MDX could contain that same name in the syntax highlighter. The test now
creates a known draft, deliberately inserts both `AblationTable` and `Algorithm`
into its body, and scopes card lookups to the Component Library.

The unexpected HTML 404s were a separate development-server routing race. In the
pinned Next.js 15.5.21 package, `setup-dev-bundler` clears the shared `appFiles`,
`pageFiles` and `devPageFiles` sets before an asynchronous filesystem scan. Requests
arriving during a metadata/middleware await can see an empty or partial route table.
The upstream report describes the same window:
https://github.com/vercel/next.js/issues/82315

Article writes and generated-registry updates trigger the filesystem watcher.
An initial attempt to stop importing the changing manifest from middleware reduced
failures in a small probe (4/47 requests before, 0/75 after), but full CI still
caught a publication POST returning HTML 404. That mitigation was insufficient and
has been withdrawn: middleware, its runtime and its visibility policies are left
unchanged. The solution must keep the route table usable during the scan itself.

## Version-pinned compatibility patch

`patches/next@15.5.21.patch` is applied by pnpm through `patchedDependencies`.
It changes only the CommonJS and ESM development-bundler implementations. Each
scan builds new local sets and, only after successful completion, synchronously
copies them into the existing published sets. No await occurs during publication,
and Set identity is retained for the router and TypeScript plugin. A rejected
scan leaves the previous complete route snapshot intact.

This is a project-maintained compatibility patch, not an upstream release or a
claim that every hot-reload failure is fixed. It does not change production route
handling, middleware authorization, atomic article writes, save preconditions or
API rate limits. Next.js, React and all dependency versions remain pinned as before.
The lockfile records the patch hash, and a frozen install applies the same patch
locally and in CI. Do not install with another package manager that ignores it.

When upgrading Next.js, review the upstream implementation and remove or rebase
this exact-version patch. Do not loosen its version constraint to make an upgrade
install silently. A patch/application mismatch or changed regression-test anchors
must be investigated rather than skipped.

## Regression evidence and gates

`tests/next-dev-route-snapshot.test.ts` executes the actual installed dependency's
scan block with controlled asynchronous metadata reads. It checks both module
formats for complete route snapshots during awaits and preservation after a failed
scan. All four cases fail against the unpatched code and pass with the patch.
This deterministically tests the race window without sleeps or request retries.

`tests/e2e/editor-index-stability.spec.ts` interleaves 12 version-checked writes
with editor/list/public API reads, then verifies deletion. It rejects an HTML
response where JSON is required and does not retry mutations.

CI starts the complete Playwright suite three separate times with `--retries=0`.
Every run must pass; a failure stops the job and fails `release-gate`. Each run
starts a fresh authoring process and fresh rate-limit state. Turbopack remains
enabled for the real development command and for the tests. Reports, traces and
server output are retained per pass under `playwright-report/`, `test-results/`
and `editor-logs/`.

After updating the branch, install the patched dependency before starting dev:

```bash
pnpm install --frozen-lockfile
pnpm test:e2e --retries=0
```

Do not run concurrent authoring servers or content commands against one checkout.
See [save safety](editor-save-safety.md) and [release safety](release-safety.md).
