# Editor Guide

Use this guide to create, edit, publish, archive, restore, and delete posts.
The editor writes MDX and image files directly to the filesystem; it is not a database-backed CMS.

## Open the Editor

For local authoring:

```bash
pnpm dev
```

Open:

```text
http://localhost:3000/editor
```

No environment file is required locally.

The editor is unavailable in production. Editing, previewing, and changing post status happen locally; the public site changes only after the resulting files are committed and deployed.

## Post Lifecycle

| Status    | Public | Editable | Available actions                       |
| --------- | ------ | -------- | --------------------------------------- |
| Draft     | No     | Yes      | Save, preview, publish, or delete       |
| Published | Yes    | Yes      | Save changes, move to draft, or archive |
| Archived  | No     | No       | Restore to draft or delete permanently  |

Published posts cannot be deleted directly. Archive the post first, then delete it permanently.

## Create a Post

Select **New Draft** in `/editor`, fill in the title, ID, description, and body,
then select **Save Draft**. This creates:

```text
app/(post)/<year>/my-first-post/article.mdx
```

If the current document has unsaved changes, confirm before starting the new
draft. The **ID** is the stable technical identifier used for the file path and
URL; it must use lowercase letters, numbers, and single hyphens. The **Title**
is the reader-facing heading used in article pages, search, and sharing, so it
can be edited without changing the URL. The published date determines the year
directory. Changing an existing post's ID or published year moves its file and
changes its URL; no redirect is created automatically.

For scripted creation, use:

```bash
pnpm new:post --id my-first-post --title "My First Post" --description "A short summary of the post."
```

Both paths synchronize `posts/manifest.json` when the draft is saved or
created.

## Edit and Preview

1. Select **Load** and open a post.
2. Update its metadata and MDX body.
3. Upload or select images when needed.
4. Select **Save Draft** or **Save Published Changes**.
5. Select **Open Preview** or **Open Post** to inspect the saved version.

Editor saves update the MDX file and synchronize `posts/manifest.json` automatically. A title, description, predefined topics, valid heading hierarchy, image alt text, and internal article links are checked before the file is written. Browser autosave helps recover unsaved input, but it does not replace saving the post to disk.

After the first save, select **Changes** to compare the current editor content
with the MDX file on disk, or the saved MDX file with Git `HEAD`. These are
separate baselines: `published` is only an article status, not a saved version,
Git commit, or VPS deployment.

## Writing Assistance

The editor builds an **Article Outline** from `##`, `###`, and `####` headings. Select a
heading to move the cursor to it; hierarchy errors are shown immediately.

The MDX editor highlights Markdown syntax while keeping the same native text
editing behavior. Use its toolbar for bold, links, inline or block code,
quotes, lists, and `##` headings. It writes ordinary MDX. **⌘/Ctrl+B** formats
bold text and **⌘/Ctrl+K** inserts a link around the current selection.

Selecting **Publish Post** opens a readiness checklist for the title,
description, topics, series position, image alt text, heading hierarchy,
internal links, and reading time. Failures block publishing; an empty topic
selection is shown as a recommendation because topics remain optional.

Topics are a controlled catalog. Select them from the editor; to introduce a new one, add its canonical name and slug to `content/topics.json` before using it in an article. `pnpm check`, `pnpm new:post`, and editor saves reject undefined topics.

## MDX Components

The editor starts with a small set of writing essentials: Markdown, callouts,
code, tables, steps, tabs, figures, mathematics, Mermaid diagrams,
citations, and video. Select **Show advanced components** only for
specialized research, data, media, or interactive blocks. Searching always
includes the full component catalog; this display choice never changes how an
existing MDX article renders.

Use **Algorithm** for reproducible pseudocode, not a prose checklist. Its
configurator supports adding, removing, reordering, indenting, and annotating
steps; the result remains plain MDX that can also be edited by hand. Use
**Emphasized steps** only to point to a rendered line that the surrounding prose
discusses directly; it is not syntax highlighting.

For formal results, use `Table` with an explicit label, title, caption, source,
and notes rather than a bare pipe table. Use `RegressionTable` only for empirical estimates with model
columns, supplied standard errors or confidence intervals, and disclosed sample
statistics. It never calculates p-values or significance markers: every
annotation must be supplied and justified by the author. `Chart` supports an
explicit interval per series and grouped or stacked bars; label the interval
and state how it was produced. Stack bars only when their components add to an
interpretable total.

Use `ScatterPlot` for calibration, agreement, correlation, or dispersion, and
state what each point represents. Use `Histogram` with author-specified bins;
the component deliberately does not choose a binning rule from raw data. Use
`BoxPlot` with a supplied five-number summary and state the whisker convention.
These three components are for distributions and relationships; do not replace
them with pie charts when readers need accurate comparison.

For historical evidence, use `SourceExcerpt` when readers need to examine a
facsimile alongside a diplomatic transcription, reading text, or translation.
Record the repository and locator with the excerpt, and state every
normalisation, transcription, translation, or derivative choice that affects
the evidence. Use its default `compact` layout for a short witness; select
`reading` for longer transcription or translation, which puts the facsimile
above the text columns. Do not use it as decoration for an ordinary quotation.

Use **Citation + Bibliography** for every external source. Each inline
`Citation` must use the same stable `refId` and label as exactly one
`BibliographyItem` at the end of the article. The content checks reject missing
or mismatched references. Use `title`, `authors`, `venue`, `year`, and `links`
whenever the source has those fields; every entry is self-closing. `note` is
optional and reserved for a material version, access, or evidence limitation,
not a general annotation. Do not use the retired footnote components.

For images, `alt` describes the visual content for readers who cannot see it;
it is not a visible caption. Use `Caption` for explanatory text, and wrap an
important, referenceable image in `Figure` with an ID.

## Formal Definitions and Cross-References

Use `Definition` for a concept that will be referred to later. Its `id` is a
stable, article-local anchor; keep it unchanged after publishing. Use
`CrossReference` with that ID and an explicit reader-facing label such as
`Definition 1`, `Figure 2`, or `Equation (3)`.

`pnpm check` rejects a missing target, duplicate target, missing definition ID,
or a cross-reference without a label. Referenceable targets are `Definition`,
`TheoremBlock`, `Algorithm`, `MathBlock`, equations inside `EquationGroup`,
`Figure`, `Table`, `RegressionTable`, `Chart`, `SourceExcerpt`, and headings
with an explicit `[#id]` suffix. `ScatterPlot`, `Histogram`, and `BoxPlot` are
also referenceable figure targets.
Cross-references stay inside one article; use a normal Markdown link for other
articles and external sources.

## Write a Series

A series is a deliberately ordered, multi-part piece of writing. It has a public overview at `/series/<slug>` and each article gets previous/next navigation. Do not use a series as an extra topic or a loose collection of related posts.

Define the series first in `content/series.json` with a stable slug, title, and description. Then choose it in the editor and set a positive **Series Position** for every article. Positions must be unique within a non-archived series; drafts are checked too, so they cannot accidentally claim a published position.

For command-line creation, provide both fields together:

```bash
pnpm new:post --id first-reliability-note --title "First reliability note" --description "A concise description." --series reliable-web-delivery --series-order 1
```

`pnpm check`, the editor save API, and `pnpm sync:posts` reject unknown series, missing positions, positions without a series, and duplicate positions. Only series with published articles appear on the public site.

For MDX components and examples, open `/editor/components`.

## Publish and Unpublish

To publish a draft, select **Publish Post** and confirm. This saves the post
with `published` status and synchronizes the post index for the next build; it
does not deploy to the VPS. Commit and deploy the resulting files to make the
article public.

For a published post:

- **Save Published Changes** keeps it public and updates its content.
- **Move To Draft** removes it from public listings and makes it a draft.
- **Archive Post** removes it from public view and makes it read-only.

To edit an archived post, select **Restore To Draft** first.

## Delete a Post

Drafts can be deleted with **Delete Draft**.

Published posts must follow this sequence:

```text
Published -> Archive Post -> Delete Permanently
```

Deletion removes the post MDX file and synchronizes `posts/manifest.json`. It does not automatically remove files from `public/images/<post-id>`. Remove unused assets before deleting the post, or remove them manually afterward only after confirming that no other content references them.

Permanent deletion cannot be undone through the editor. Create a content backup first when recovery may be needed:

```bash
pnpm backup:content
```

## Manual File Edits

When editing `article.mdx` files outside `/editor`, synchronize and validate the content:

```bash
pnpm sync:posts
pnpm check
pnpm build
```

`pnpm check` verifies post metadata, the generated manifest, lint rules, and TypeScript.

## Browser Lifecycle Test

The editor lifecycle runs in Chromium against a separate local Next.js output
directory, so it does not conflict with `pnpm dev`.

On a new machine, install Chromium once:

```bash
pnpm exec playwright install chromium
```

Then run:

```bash
pnpm test:e2e
```

The test creates a uniquely named temporary article, takes it through draft,
published, archived, restored, and deleted states, then removes it.

## Deploy Published Content

Editor changes remain in the local Git worktree. Review and validate the MDX, manifest, and image changes:

```bash
git status
pnpm check
pnpm build
git add 'app/(post)' posts/manifest.json public/images
git commit
```

Then deploy the committed version:

```bash
pnpm deploy:vps
```

Production `/editor` and `/api/editor/*` return `404`. The VPS only runs content included in a deployed artifact.

The deployment build imports and prerenders only `published` articles. Draft and archived MDX are omitted from the VPS bundle, and their URLs return `404` in production.
