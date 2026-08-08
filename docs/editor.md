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
draft. IDs must use lowercase letters, numbers, and single hyphens. The
published date determines the year directory. Changing an existing post's ID
or published year moves its file and changes its URL; no redirect is created
automatically.

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

Topics are a controlled catalog. Select them from the editor; to introduce a new one, add its canonical name and slug to `content/topics.json` before using it in an article. `pnpm check`, `pnpm new:post`, and editor saves reject undefined topics.

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
