# Wang Qiwen Blog

An English-only personal publishing site built with Next.js, MDX, Tailwind CSS, SWR, and Upstash Redis.

It includes:
- a blog homepage and post pages
- a local MDX editor at `/editor`
- post metadata syncing and validation scripts
- image asset management for posts
- white-label configuration through `site.config.js`

## Prerequisites

- Node.js 20.9+
- pnpm through corepack, or an existing pnpm installation

On Ubuntu, install Node.js from NodeSource if `corepack` is missing:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo corepack enable
```

Then check:

```bash
node -v
corepack -v
```

## Quick Start

1. Install dependencies:

```bash
pnpm install
```

2. Start the development server:

```bash
pnpm dev
```

3. Open:

```text
http://localhost:3000
```

No local env file is required for the default development flow.

Create `.env.local` only when you need real external services locally:

```bash
cp .env.example .env.local
```

Then fill only the values you need.

If you want a one-command local setup first, use:

```bash
bash scripts/dev/setup.sh
```

On Windows PowerShell:

```powershell
pwsh ./scripts/dev/setup.ps1
```

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `UPSTASH_REDIS_REST_URL` | Required in production | Redis REST endpoint used for view counts |
| `UPSTASH_REDIS_REST_TOKEN` | Required in production | Redis auth token |
| `UPSTASH_REDIS_FORCE_REMOTE` | Optional | Use the real Redis instance in local development |
| `GEO_IP_API_KEY` | Optional | Enables the demo geo API route |

In local development, missing Redis credentials use an in-memory mock, `/editor` is available without authentication, and `/api/geo` stays disabled without `GEO_IP_API_KEY`. The editor and its APIs are unavailable in production.

See [deployment.md](docs/deployment.md) for production env handling.

## Common Commands

- `pnpm dev` starts the local development server.
- `pnpm lint` runs ESLint.
- `pnpm check` validates content, lint rules, and TypeScript together.
- `pnpm build` creates a production build.
- `pnpm start` serves the production build.
- `pnpm new:post --id my-post` creates a new draft post.
- `pnpm sync:posts` normalizes post metadata and rebuilds `posts/manifest.json`.
- `pnpm sync:posts -- --check` verifies that post metadata and the manifest are in sync.
- `pnpm lint:posts` validates post metadata.
- `pnpm backup:content` creates a timestamped content backup.
- `pnpm reset:content -- --force` resets posts, links, and uploaded images after creating a backup.

## Writing Posts

Create a new draft:

```bash
pnpm new:post --id my-first-post
```

This creates:

```text
app/(post)/<year>/<slug>/page.mdx
```

Then open `/editor` to write, preview, and publish it.

See [editor.md](docs/editor.md) for the complete create, edit, publish, archive, restore, and delete workflow.

Editor saves synchronize post metadata automatically. After editing MDX files manually, run `pnpm sync:posts`.

Before shipping, verify:

```bash
pnpm check
pnpm build
```

## Editor

The editor is a local authoring tool, not a production CMS.
Use [editor.md](docs/editor.md) for authoring and lifecycle operations.

Edit and preview locally, commit the resulting MDX, manifest, and image changes, then deploy them with `pnpm deploy:vps`. Production `/editor` and `/api/editor/*` return `404`.

## White-Labeling

To turn this into your own site:

1. Update `site.config.js`
2. Replace old posts and images if needed
3. Optionally configure `.env.local`
4. Run the verification commands above

Related guides:

- [Editor guide](docs/editor.md)
- [VPS deployment](docs/deployment.md)
- [Site customization](docs/customization.md)
- [Operations runbook](docs/operations.md)

## Project Structure

- `app/` application routes, API routes, editor, and posts
- `app/(post)/` post content and post-specific components
- `app/api/` local APIs for editor, posts, views, and health
- `docs/` authoring, customization, deployment, and operations guides
- `posts/manifest.json` generated post index
- `site.config.js` public site identity and copy
- `deploy.env` non-secret VPS deployment settings
- `styles/` global styles
- `scripts/` project maintenance and VPS deployment scripts; see [scripts/README.md](scripts/README.md)

## Deployment

For the self-hosted `wangqiwen.me` VPS:

```bash
pnpm deploy:vps
```

The command reads its non-secret target settings from [`deploy.env`](deploy.env). Command environment variables can override individual values for one deployment.

For first-time VPS setup with env upload:

```bash
UPLOAD_ENV=1 SETUP_SERVER=1 pnpm deploy:vps
```

`SETUP_SERVER=1` installs and configures the VPS runtime environment: Node.js, pnpm, Caddy, the `nextjs` service user, `/srv/nextjs`, systemd, and the Caddy site config. Leave it unset for normal later releases.

The deploy command builds a standalone artifact locally, uploads it to the VPS, restarts `wangqiwen-me.service`, and checks `/api/health`.

Details:

- [VPS deployment](docs/deployment.md) for the short release flow
- [Operations runbook](docs/operations.md) for runtime checks and recovery
