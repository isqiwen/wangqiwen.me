# Wang Qiwen Blog

An English-only personal publishing site built with Next.js, MDX, Tailwind CSS, SWR, and Upstash Redis.

It includes:
- a blog homepage and post pages
- a local MDX editor at `/editor`
- post metadata syncing and validation scripts
- image asset management for posts
- white-label configuration through `site.config.js`

## Prerequisites

- Node.js 18+
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

2. Create your local environment file:

```bash
cp .env.example .env.local
```

3. Fill in the values you need in `.env.local`.

4. Start the development server:

```bash
pnpm dev
```

5. Open:

```text
http://localhost:3000
```

If you want a one-command local setup first, use:

```bash
bash scripts/setup-dev.sh
```

On Windows PowerShell:

```powershell
pwsh ./scripts/setup-dev.ps1
```

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `UPSTASH_REDIS_REST_URL` | Recommended | Redis REST endpoint used for view counts |
| `UPSTASH_REDIS_REST_TOKEN` | Recommended | Redis auth token |
| `UPSTASH_REDIS_FORCE_REMOTE` | Optional | Use the real Redis instance in local development |
| `GEO_IP_API_KEY` | Optional | Enables the demo geo API route |
| `EDITOR_ACCESS_TOKEN` | Optional | Protects `/editor` and its write APIs |

See [DEPLOY.md](DEPLOY.md) for where to get each value.

## Common Commands

- `pnpm dev` starts the local development server.
- `pnpm lint` runs ESLint.
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

Then open `/editor` to:
- edit metadata
- write MDX content
- upload images
- manage drafts, published posts, and archived posts

After content changes, sync metadata:

```bash
pnpm sync:posts
```

Before shipping, verify:

```bash
pnpm lint
pnpm lint:posts
pnpm sync:posts -- --check
pnpm build
```

## Editor

The editor is intended as a local or self-hosted authoring tool, not a public CMS.
For the self-hosted artifact deployment, production `/editor` changes are written to the VPS app directory and do not automatically enter Git; see [DEPLOY.md](DEPLOY.md) and [OPERATIONS.md](OPERATIONS.md) before using it on the public server.

Current editor features:
- draft, published, and archived status workflow
- autosave and unsaved-change warnings
- recent draft restore
- image asset upload and management
- MDX component insertion
- protected access when `EDITOR_ACCESS_TOKEN` is set

## White-Labeling

To turn this into your own site:

1. Update `site.config.js`
2. Replace old posts and images if needed
3. Configure `.env.local`
4. Run the verification commands above

Related guides:
- [DEPLOY.md](DEPLOY.md)
- [INIT.md](INIT.md)
- [OPERATIONS.md](OPERATIONS.md)

## Project Structure

- `app/` application routes, API routes, editor, and posts
- `app/(post)/` post content and post-specific components
- `app/api/` local APIs for editor, posts, views, and health
- `posts/manifest.json` generated post index
- `site.config.js` public site identity and copy
- `styles/` global styles
- `scripts/` project maintenance and content scripts

## Deployment

The site works well on Vercel. For the self-hosted `wangqiwen.me` deployment, the recommended path is:

- build a Next.js standalone artifact on a development machine or CI runner
- upload the artifact to the VPS
- run the app as `wangqiwen-me.service` with systemd
- expose `https://wangqiwen.me` with Caddy

Build an artifact:

```bash
bash scripts/build-deploy-artifact.sh
```

Deploy on the VPS:

```bash
sudo env \
  APP_NAME=wangqiwen-me \
  SERVICE_USER=nextjs \
  DOMAIN=wangqiwen.me \
  SERVER_ALIASES=www.wangqiwen.me \
  ENV_FILE_PATH=/tmp/prod.env \
  ARTIFACT_TARBALL=/tmp/<artifact>.tar.gz \
  bash scripts/provision-ubuntu.sh
```

Runtime defaults:

- app directory: `/srv/nextjs/wangqiwen-me`
- process: `wangqiwen-me.service`
- local app listener: `127.0.0.1:3000`
- public ingress: Caddy on `80/tcp` and `443/tcp`

For deployment and operational details, use:

- [DEPLOY.md](DEPLOY.md)
- [OPERATIONS.md](OPERATIONS.md)
