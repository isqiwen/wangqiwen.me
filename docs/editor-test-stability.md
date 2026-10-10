# Editor request and test stability

## Two distinct failures

The component test used a page-wide `AblationTable` text locator. The editor's
restored MDX could contain that same name in the syntax highlighter. The test now
creates a known draft, deliberately inserts both `AblationTable` and `Algorithm`
into its body, and scopes card lookups to the Component Library.

The unexpected HTML 404s were a separate development-server routing race. In the
Next.js 15.5 line (checked through 15.5.27), `setup-dev-bundler` clears the shared `appFiles`,
`pageFiles` and `devPageFiles` sets before an asynchronous filesystem scan. Requests
arriving during a metadata/middleware await can see an empty or partial route table.
The upstream report describes the same window:
https://github.com/vercel/next.js/issues/82315

Article writes and generated-registry updates trigger the filesystem watcher.
An initial attempt to stop importing the changing manifest from middleware reduced
failures in a small probe (4/47 requests before, 0/75 after), but full CI still
caught a publication POST returning HTML 404. That mitigation was insufficient and
has been withdrawn. The first fix that held was a patch to Next.js that kept the
route table usable during the scan. It is no longer needed; see below.

## Articles are stored outside `app/`

The route-table race needs a trigger. Next.js rescans its routes only when a
file inside `app/` (or `pages/`) changes, or one of a few root files does:
the middleware, `.env*` and `tsconfig.json`. Every editor save used to write
there. The article, its temporary file and the generated registry all lived in
`app/(post)/`, so each save opened the window that its own follow-up requests
then fell into.

Articles now live in `content/posts/<year>/<slug>/article.mdx` and the
generated registry in `content/posts/post-registry.ts`. Public URLs are
unchanged: routes come from `app/(post)/[year]/[slug]/page.tsx`, which imports
the registry. `POSTS_DIRECTORY` in `utils/shared/post-fields.ts` is the single
definition of the location, and the editor API rejects any other path.

Measured with the watcher and ignore rule that Next.js 15.5.27 itself uses:

| Write                                    | Rescans triggered |
| ---------------------------------------- | ----------------- |
| Save an article under `app/(post)/`      | 1                 |
| Rewrite `app/(post)/post-registry.ts`    | 1                 |
| Save an article under `content/posts/`   | 0                 |
| Rewrite `content/posts/post-registry.ts` | 0                 |
| Rewrite `posts/manifest.json`            | 0                 |

Do not move article sources, the registry or anything else the editor writes
back under `app/`, and do not name such a directory with an `app` prefix: the
watcher matches paths by string prefix. Editing application code under `app/`
while the editor is in use can still trigger a rescan. That is ordinary
development, not the save path.

## The Next.js patch was removed

Between the discovery of the race and the move above, the project carried a
pnpm patch for Next.js. It made each scan build new route sets and publish them
only when complete. Because pnpm binds a patch to an exact version, every
Next.js upgrade, including security releases, needed a manual rebase.

With articles outside `app/`, editor saves no longer start a scan, so the patch
had nothing left to protect on the save path. It was deleted together with its
unit test after the complete browser suite passed three consecutive no-retry
runs on unpatched Next.js 15.5.27. Next.js now installs unmodified and upgrades
are ordinary version bumps.

If HTML 404s return for editor requests, first check that nothing the editor
writes has moved back under `app/`. Do not reintroduce the patch as a first
response.

## The middleware imports nothing that changes

A second cause of bad responses survived the move. The middleware used to import
`posts/manifest.json` to decide which article paths exist, and every save
rewrites that file. The development server recompiles the middleware whenever
one of its imports changes. While it does, the router and the renderer can
disagree about whether the middleware matches a path, and Next.js then answers
the request with an empty `200`: no body, no content type and none of the
configured headers. Browser tests saw it as an editor page that never loaded or
a JSON response that could not be parsed, in roughly two runs out of five.

The middleware now guards only `/editor` and `/api/editor`, and imports
nothing that authoring changes, so a save no longer recompiles it. Which
articles are public is decided by the article route:
`app/(post)/[year]/[slug]/page.tsx` sets `dynamicParams = false`, so only the
paths that `generateStaticParams` lists exist. In production those are the
published articles; a draft, an archived article or an unknown path is a 404
that is neither rendered nor cached. Local work also lists drafts.

Do not import the manifest, the registry or any other generated file into
`middleware.tsx`. The index stability test also requires a content type on the
editor page, so an empty answer fails it.

## Selection after formatting

Bold, link and the other formatting actions replace the body and then restore a
selection. The restore used to wait for the next animation frame. An input that
arrived inside that frame saw the old selection: a test that filled the body
right after a shortcut replaced only part of it, about once in thirty runs.

The selection is now restored in the same React commit that writes the new
body, so it is final when the event handler returns. A browser test dispatches
the shortcut and reads the selection back before any frame can run; it fails
deterministically against the one-frame delay.

## Concurrent article listing

After the route patch, a complete no-retry browser pass succeeded, but the second
pass exposed a different JSON 500. The article-list walker called `stat` on every
entry before filtering it; an atomic save renamed a `.article.mdx.*.tmp` file
between `readdir` and `stat`, producing ENOENT. The request correctly failed the
stability gate rather than being retried or accepted as an expected error.

The list collector now filters the allowed year/slug/article entries before
metadata I/O, so temporary files are never inspected. An article or directory
removed during enumeration is skipped only for ENOENT; permission and other I/O
errors still propagate. Listing keeps its existing order, path format and status
fallback. It is a live directory view, not a transactional filesystem snapshot.
The existing mutation lock, atomic writer and precondition checks are unchanged.
Eight deterministic collector tests cover temporary files, disappearing entries,
permission errors, missing roots and ordering. The HTTP regression continues to
require a successful JSON list response while saves are running.

## Regression evidence and gates

`tests/e2e/editor-index-stability.spec.ts` interleaves 12 version-checked writes
with editor/list/public API reads, then verifies deletion. It rejects an HTML
response where JSON is required and does not retry mutations.

CI starts the complete Playwright suite three separate times with `--retries=0`.
Every run must pass; a failure stops the job and fails `release-gate`. Each run
starts a fresh authoring process and fresh rate-limit state. Turbopack remains
enabled for the real development command and for the tests. Reports, traces and
server output are retained per pass under `playwright-report/`, `test-results/`
and `editor-logs/`.

After updating the branch, install dependencies before starting dev:

```bash
pnpm install --frozen-lockfile
pnpm test:e2e --retries=0
```

Do not run concurrent authoring servers or content commands against one checkout.
See [save safety](editor-save-safety.md) and [release safety](release-safety.md).
