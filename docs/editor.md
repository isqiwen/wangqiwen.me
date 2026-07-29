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

No environment file is required locally. Set `EDITOR_ACCESS_TOKEN` in `.env.local` only when the local editor needs password protection.

The editor is unavailable in production. Editing, previewing, and changing post status happen locally; the public site changes only after the resulting files are committed and deployed.

## Post Lifecycle

| Status    | Public | Editable | Available actions                       |
| --------- | ------ | -------- | --------------------------------------- |
| Draft     | No     | Yes      | Save, preview, publish, or delete       |
| Published | Yes    | Yes      | Save changes, move to draft, or archive |
| Archived  | No     | No       | Restore to draft or delete permanently  |

Published posts cannot be deleted directly. Archive the post first, then delete it permanently.

## Create a Post

Create a draft from the repository:

```bash
pnpm new:post --id my-first-post --title "My First Post"
```

This creates:

```text
app/(post)/<year>/my-first-post/page.mdx
```

It also updates `posts/manifest.json`. Open `/editor`, select **Load**, and choose the new draft.

IDs must use lowercase letters, numbers, and single hyphens. The published date determines the year directory. Changing an existing post's ID or published year moves its file and changes its URL; no redirect is created automatically.

## Edit and Preview

1. Select **Load** and open a post.
2. Update its metadata and MDX body.
3. Upload or select images when needed.
4. Select **Save Draft** or **Save Published Changes**.
5. Select **Open Preview** or **Open Post** to inspect the saved version.

Editor saves update the MDX file and synchronize `posts/manifest.json` automatically. Browser autosave helps recover unsaved input, but it does not replace saving the post to disk.

For MDX components and examples, open `/editor/components`.

## Publish and Unpublish

To publish a draft, select **Publish Post** and confirm. Publishing first saves the post with `published` status, then synchronizes the post index.

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

When editing `page.mdx` files outside `/editor`, synchronize and validate the content:

```bash
pnpm sync:posts
pnpm check
pnpm build
```

`pnpm check` verifies post metadata, the generated manifest, lint rules, and TypeScript.

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
