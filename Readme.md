# Wang Qiwen Blog

An English-only personal publishing site built with Next.js, MDX, Tailwind CSS, SWR, and Upstash Redis.

It includes:
- a blog homepage and post pages
- a local MDX editor at `/editor`
- post metadata syncing and validation scripts
- image asset management for posts
- white-label configuration through `site.config.js`

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

See [DEPLOY.md](E:/wangqiwen.me/DEPLOY.md) for where to get each value.

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
- [DEPLOY.md](E:/wangqiwen.me/DEPLOY.md)
- [INIT.md](E:/wangqiwen.me/INIT.md)
- [OPERATIONS.md](E:/wangqiwen.me/OPERATIONS.md)

## Project Structure

- `app/` application routes, API routes, editor, and posts
- `app/(post)/` post content and post-specific components
- `app/api/` local APIs for editor, posts, views, and health
- `posts/manifest.json` generated post index
- `site.config.js` public site identity and copy
- `styles/` global styles
- `scripts/` project maintenance and content scripts

## Deployment

The site works well on Vercel, but any Node 18+ environment that can run:

```bash
pnpm install
pnpm build
pnpm start
```

can host it.

For a simple Ubuntu self-hosted deploy helper:

On a brand-new server, start with a temporary bootstrap checkout so you have the scripts locally:

```bash
sudo apt-get update
sudo apt-get install -y git
git clone https://github.com/your-name/your-repo.git ~/blog-bootstrap
cd ~/blog-bootstrap
```

Then run the all-in-one provision script:

```bash
sudo env \
  APP_NAME=my-blog \
  DOMAIN=example.com \
  SERVER_ALIASES=www.example.com \
  ENABLE_HTTPS=1 \
  CERTBOT_EMAIL=admin@example.com \
  bash scripts/provision-ubuntu.sh
```

If `REPO_URL` is omitted, the provision script reuses the current checkout's `origin` remote for the real deploy clone into `/srv/nextjs/app`.

Manual step-by-step flow:

```bash
sudo apt-get update
sudo apt-get install -y git
git clone https://github.com/your-name/your-repo.git ~/blog-bootstrap
cd ~/blog-bootstrap
sudo bash scripts/install-ubuntu-env.sh
sudo -u nextjs -H git clone <repo-url> /srv/nextjs/app
cd /srv/nextjs/app
sudo -u nextjs -H env APP_NAME=my-blog bash scripts/deploy-ubuntu.sh
sudo env DOMAIN=example.com SERVER_ALIASES=www.example.com APP_PORT=3000 bash scripts/configure-ubuntu-site.sh
```

The bootstrap script now creates a dedicated system user by default:

```bash
sudo adduser --system --group --home /srv/nextjs --shell /usr/sbin/nologin nextjs
```

It also prepares `/srv/nextjs/app` for the repository, then the deploy script runs the pull/build/restart flow as that `nextjs` service user instead of root.
The Nginx site script then points `example.com` at the local Next.js process on port `3000`.
The all-in-one provision script simply chains those same steps together.
Once the real deploy is in `/srv/nextjs/app`, the temporary `~/blog-bootstrap` checkout can be removed.

If your server is already prepared, you can run only:

```bash
cd /srv/nextjs/app
sudo -u nextjs -H env APP_NAME=my-blog bash scripts/deploy-ubuntu.sh
sudo env DOMAIN=example.com SERVER_ALIASES=www.example.com APP_PORT=3000 bash scripts/configure-ubuntu-site.sh
```

For deployment and operational details, use:
- [DEPLOY.md](E:/wangqiwen.me/DEPLOY.md)
- [OPERATIONS.md](E:/wangqiwen.me/OPERATIONS.md)
