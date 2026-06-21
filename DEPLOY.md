# Deployment Guide

This project can run on Vercel or on an Ubuntu VPS. The self-hosted production path is:

1. build a Next.js standalone artifact on a development machine or CI runner
2. upload the artifact to the VPS
3. run the app with systemd
4. expose the site with Caddy

Secrets and deployment-only values belong in `.env.local` on the server or in the hosting platform's secret manager.

## 1. Rebrand The Site

Public branding and profile information live in [site.config.js](site.config.js).

Update these areas first:

- `site.name`, `site.title`, `site.domain`, `site.url`, `site.description`
- `author.name`, `author.tagline`, `author.location`
- `author.images.avatar`, `author.images.avatarMuted`
- `social.primary`, `social.github`
- `project.sourceUrl`
- `navigation.headerLinks`, `navigation.followLabel`
- `home.*`
- `footer.*`
- `about.en`
- `opengraph.profileHighlights`

Once these values change, the following parts of the app follow automatically:

- global metadata and SEO
- header and footer identity
- About page
- feed metadata
- Open Graph images
- post share cards

## 2. Replace Personal Content

For a full white-label deployment, also review:

- `app/(post)/...` for posts and demos
- `links.json` for short-link cards
- `public/images/...` for portraits and article assets
- sample articles that still reference the original author, company, or domain

To reset content first:

```bash
pnpm reset:content -- --force
pnpm new:post --id my-first-post
pnpm sync:posts
```

## 3. Configure Environment Variables

Copy the example file locally:

```bash
cp .env.example .env.local
```

Then fill in the values you actually use:

| Variable | Required | Purpose |
| --- | --- | --- |
| `UPSTASH_REDIS_REST_URL` | Recommended | View counts and Redis-backed caching |
| `UPSTASH_REDIS_REST_TOKEN` | Recommended | Auth token for Upstash Redis |
| `UPSTASH_REDIS_FORCE_REMOTE` | Optional | Force real Redis in development |
| `GEO_IP_API_KEY` | Optional | Enables `/api/geo` |
| `EDITOR_ACCESS_TOKEN` | Optional but recommended | Locks `/editor` and its write APIs behind a browser unlock flow |

The standalone deployment artifact does not include `.env`, `.env.local`, `.env.production`, or other `.env*.local` files. Put production values on the VPS and pass them to the deployment script with `ENV_FILE_PATH`.

## 4. Local Verification

Before deploying, run:

```bash
pnpm lint
pnpm lint:posts
pnpm sync:posts -- --check
pnpm build
```

What each command protects:

- `pnpm lint`: catches code, JSX, and accessibility issues
- `pnpm lint:posts`: verifies post metadata
- `pnpm sync:posts -- --check`: ensures `posts/manifest.json` is in sync
- `pnpm build`: validates production compilation and route generation

## 5. Editor Access

If `EDITOR_ACCESS_TOKEN` is empty, `/editor` stays open locally. In production, set `EDITOR_ACCESS_TOKEN`.

Relevant files:

- [app/editor/page.tsx](app/editor/page.tsx)
- [app/api/editor/session/route.ts](app/api/editor/session/route.ts)
- [utils/server/editor-auth.ts](utils/server/editor-auth.ts)
- [INIT.md](INIT.md)
- [OPERATIONS.md](OPERATIONS.md)

## 6. Deploy To Vercel

Typical flow:

```bash
vercel login
vercel link
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
vercel env add GEO_IP_API_KEY
vercel env add EDITOR_ACCESS_TOKEN
vercel --prod
```

After deployment, check:

- homepage metadata
- `/about`
- one article page
- `/opengraph-image`
- `/about/opengraph-image`
- `/editor`

## 7. Self-Hosted Architecture

The recommended Ubuntu/VPS deployment uses:

| Layer | Tool | Role |
| --- | --- | --- |
| Build | `scripts/build-deploy-artifact.sh` | Build a Next.js standalone tarball outside the VPS |
| Process manager | systemd | Keep the Node.js app running as `wangqiwen-me.service` |
| Reverse proxy | Caddy | Receive public HTTP/HTTPS traffic and proxy to the app |
| App listener | Next.js standalone `server.js` | Listen on `127.0.0.1:3000` |

Default paths and names:

| Item | Default |
| --- | --- |
| App name | `wangqiwen-me` |
| systemd service | `wangqiwen-me.service` |
| Service user | `nextjs` |
| App directory | `/srv/nextjs/wangqiwen-me` |
| App listen address | `127.0.0.1:3000` |
| Caddy site file | `/etc/caddy/Caddyfile.d/wangqiwen.me.caddy` |

Port rule:

- open `80/tcp` and `443/tcp` on the VPS firewall and cloud firewall
- keep `3000/tcp` private on `127.0.0.1`; it is only for Caddy to reach the app

## 8. Build The Artifact

Do not run `next build` on the small VPS. Build the artifact on a machine with enough CPU and memory, then upload the result to the VPS.

Recommended build locations:

- home Ubuntu development machine
- Linux CI runner
- another Linux server with enough memory

Avoid building the production artifact on macOS when the runtime target is an Ubuntu VPS. Next.js standalone output can include platform-specific native dependencies. Building on Linux for Linux keeps the artifact closer to the production runtime.

Run this in the project checkout on the build machine:

```bash
bash scripts/build-deploy-artifact.sh
```

If the build machine reports that `corepack` is missing, install Node.js from an official Node.js distribution first. On Ubuntu:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo corepack enable
```

The artifact is written to `dist/` and includes:

- the standalone Node.js server from `.next/standalone`
- `.next/static`
- `public/`
- runtime source files needed by the local editor and content sync flows

Useful build env vars:

- `ARTIFACT_DIR=dist`
- `ARTIFACT_NAME=wangqiwen-me.tar.gz`
- `SKIP_INSTALL=1`
- `RUN_LINT_POSTS=0`

The VPS receives only the finished tarball. It does not need to run:

```bash
pnpm install
pnpm build
next build
```

Running the standalone artifact is enough for the full dynamic app, as long as the VPS has Node.js, the production env file, writable app directory, and the systemd service.

## 9. First-Time VPS Setup

Upload the artifact and production env file from your local machine:

```bash
scp dist/<artifact>.tar.gz qiwen@wangqiwen.me:/tmp/
scp .env.production qiwen@wangqiwen.me:/tmp/prod.env
```

Log in to the VPS:

```bash
ssh qiwen@wangqiwen.me
```

Keep a small bootstrap checkout on the VPS so the deployment scripts are available:

```bash
sudo apt-get update
sudo apt-get install -y git
sudo git clone https://github.com/isqiwen/wangqiwen.me.git /opt/wangqiwen-me-bootstrap
cd /opt/wangqiwen-me-bootstrap
```

Run the all-in-one provision script:

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

The provision script will:

- install Node.js, corepack, pnpm, and Caddy
- create the `nextjs` service user
- prepare `/srv/nextjs/wangqiwen-me`
- copy `/tmp/prod.env` to `/srv/nextjs/wangqiwen-me/.env.local`
- extract the standalone artifact
- write `/etc/systemd/system/wangqiwen-me.service`
- start and enable the systemd service
- write the Caddy reverse proxy config
- validate and reload Caddy

## 10. Manual Step-By-Step Deploy

Use this flow when you want to run each step explicitly.

Install server dependencies:

```bash
cd /opt/wangqiwen-me-bootstrap
sudo env \
  APP_NAME=wangqiwen-me \
  SERVICE_USER=nextjs \
  bash scripts/install-ubuntu-env.sh
```

Install the production env file:

```bash
sudo install -d -o nextjs -g nextjs -m 0755 /srv/nextjs/wangqiwen-me
sudo install -m 0600 -o nextjs -g nextjs /tmp/prod.env /srv/nextjs/wangqiwen-me/.env.local
```

Deploy the artifact:

```bash
sudo env \
  APP_NAME=wangqiwen-me \
  SERVICE_USER=nextjs \
  ARTIFACT_TARBALL=/tmp/<artifact>.tar.gz \
  bash scripts/deploy-ubuntu.sh
```

Configure Caddy:

```bash
sudo env \
  APP_NAME=wangqiwen-me \
  DOMAIN=wangqiwen.me \
  SERVER_ALIASES=www.wangqiwen.me \
  APP_HOST=127.0.0.1 \
  APP_PORT=3000 \
  bash scripts/configure-ubuntu-site.sh
```

## 11. Updating An Existing VPS

Build and upload a new artifact:

```bash
bash scripts/build-deploy-artifact.sh
scp dist/<artifact>.tar.gz qiwen@wangqiwen.me:/tmp/
```

Deploy it on the VPS:

```bash
ssh qiwen@wangqiwen.me
cd /opt/wangqiwen-me-bootstrap
git pull --ff-only
sudo env \
  RUN_INSTALL=0 \
  RUN_SITE_CONFIG=0 \
  APP_NAME=wangqiwen-me \
  SERVICE_USER=nextjs \
  ARTIFACT_TARBALL=/tmp/<artifact>.tar.gz \
  bash scripts/provision-ubuntu.sh
```

Re-run the Caddy step only when the domain, aliases, app host, or app port changes:

```bash
sudo env \
  APP_NAME=wangqiwen-me \
  DOMAIN=wangqiwen.me \
  SERVER_ALIASES=www.wangqiwen.me \
  APP_PORT=3000 \
  bash scripts/configure-ubuntu-site.sh
```

## 12. Check The Deployment

Process status:

```bash
sudo systemctl status wangqiwen-me
sudo journalctl -u wangqiwen-me -n 100 --no-pager
```

Local app check on the VPS:

```bash
curl -I http://127.0.0.1:3000
curl -s http://127.0.0.1:3000/api/health
```

Caddy check:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl status caddy
sudo journalctl -u caddy -n 100 --no-pager
```

Public check:

```bash
curl -I https://wangqiwen.me
curl -s https://wangqiwen.me/api/health
```

## 13. Operational Notes

The artifact replaces the contents of `APP_DIR`. If the built-in editor changes posts or uploaded assets on the production server, sync those changes back to the source repo before the next release.

Production source of truth:

- code and content: Git repository
- runtime secrets: server `.env.local`
- public ingress: Caddy
- app process: systemd

Related docs:

- [README.md](README.md)
- [OPERATIONS.md](OPERATIONS.md)
- [INIT.md](INIT.md)
