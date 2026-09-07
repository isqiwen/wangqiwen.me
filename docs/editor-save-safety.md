# Versioned editor saves

The local editor now checks the version it loaded before updating, moving,
publishing, archiving, restoring or deleting an article. Conflicts do not replace
the current input or automatically accept the newer file's version.

## Author workflow

When another tab or an external editor changes the saved file, an outdated save
receives a persistent conflict message. Compare with the latest file without
changing your input, download your current MDX, or keep it as a new unsaved draft.
The new draft receives a distinct ID and clears its series position so it cannot
replace the original or accidentally claim the same series slot. Save it normally.
Reload latest requires confirmation whenever current input is unsaved.

During an ordinary save, typing remains enabled. The completed request marks only
its submitted snapshot as saved. Newer text and metadata stay in the editor and
remain dirty. Other saves and document-changing actions are blocked while a
request is pending. State transitions and deletion temporarily disable editing.
A failed save preserves the input and the previous base version.

Browser autosaves retain the base file version. Recovery never silently attaches
old unsaved input to a newer file version. Older snapshots without a base version
must be compared, reloaded or kept as a copy before an existing file can be changed.
The existing browser-local recovery slot is not a multi-document backup or a
cross-tab history; use Git and content backups for durable history.

## Local API contract

- `GET /api/editor?path=...` returns `{ content, version }` and an `ETag` header.
  The version is a quoted SHA-256 content validator, not a modification timestamp.
- Creating a new file requires `If-None-Match: *`, with no `previousPath`.
- Updating a file requires its exact `If-Match` version and `previousPath`.
  For a move, the validator refers to `previousPath`, while `path` is the new
  destination. An existing destination is never overwritten.
- Successful saves return `{ ok, path, version }` with the saved file's ETag.
- `DELETE /api/editor` requires the exact `If-Match` for the selected `path`.
- Missing preconditions return 428. Invalid, weak, wildcard, list or contradictory
  update validators return 400. A changed, deleted or moved source returns 412.
  Create collisions return 412; occupied move destinations return 409.
- Preconditions are evaluated inside the existing mutation queue before the first
  write or delete. Rejected conditions leave articles and indexes untouched.
- Publishing in the UI is a single version-checked save, including index sync and
  the existing rollback path. The legacy `/api/editor/publish` endpoint remains an
  index-sync operation; it does not set article status or bypass file versioning.

The Host/Origin checks and production editor restrictions still apply. Local API
clients must send a matching Origin in addition to the version precondition.
There is deliberately no force-overwrite option or wildcard update fallback.

## Guarantee boundary

This is optimistic concurrency for **one local Node.js editor process**. It
serializes cooperating HTTP mutations using the existing process-local queue.
It detects external file edits completed before the version check. It is not an
OS-wide filesystem transaction: a separate process or CLI writing during the
check/write interval is outside this guarantee. Do not run multiple authoring
servers or concurrent bulk content commands against the same checkout.

HTTP failures after a successful disk commit can leave the outcome uncertain;
input is retained, and retrying with the old version cannot overwrite newer data.
Compare or reload the file to reconcile the outcome. Git commits, deployment and
the production site's publication model are unchanged.

## Regression coverage

`pnpm test` covers strong version generation and precondition policy.
`pnpm test:e2e` exercises two tabs, preserved conflict input, download/copy recovery,
confirmed reload, delayed save acknowledgements, failed-save retry, stale autosave
recovery, concurrent HTTP saves, rename/delete conflicts, external disk edits,
create collisions and publication rollback using isolated fixture articles.
