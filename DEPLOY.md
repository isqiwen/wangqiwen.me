# White-Label Deployment Guide

This project can be turned into another person's or team's site without rewriting the app shell.
The main rule is simple:

- Public branding and profile information live in `site.config.js`.
- Secrets and deployment-only values live in `.env.local` or your hosting platform's environment settings.

## 1. Rebrand The Site

Start with [site.config.js](E:/wangqiwen.me/site.config.js).

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

Once these values change, the following parts of the app will automatically follow:

- global metadata and SEO
- header and footer identity
- About page
- feed metadata
- Open Graph images
- post share cards

## 2. Replace Personal Content

The shared config removes most shell-level identity, but content files are still your real content.
For a full white-label deployment, also review:

- `app/(post)/...` for posts and demos
- `links.json` for short-link cards
- `public/images/...` for portraits and article assets
- any sample article that still references the original author, company, or domain

If you want a clean starting point, remove old posts first and then create new ones with:

```bash
pnpm reset:content -- --force
pnpm new:post --id my-first-post
```

After editing posts, rebuild the content manifest:

```bash
pnpm sync:posts
```

## 3. Configure Environment Variables

Copy the example file:

```bash
cp .env.example .env.local
```

Then fill in the values you actually use:

| Variable | Required | Purpose | Where to get it |
| --- | --- | --- | --- |
| `UPSTASH_REDIS_REST_URL` | Recommended | View counts and Redis-backed caching | Create a Redis database in the Upstash console and copy the REST URL from the database details page |
| `UPSTASH_REDIS_REST_TOKEN` | Recommended | Auth token for Upstash Redis | Copy the REST TOKEN from the same Upstash database details page |
| `UPSTASH_REDIS_FORCE_REMOTE` | Optional | Force real Redis in development | Local toggle only; set it yourself to `1` if needed |
| `GEO_IP_API_KEY` | Optional | Enables `/api/geo` | Create an account at ipgeolocation.io and copy an API key from the dashboard / API Keys page |
| `EDITOR_ACCESS_TOKEN` | Optional but recommended for shared deployments | Locks `/editor` and its write APIs behind a browser unlock flow | Self-generated secret; create your own strong random password/token |

Keep these values out of `site.config.js`.
They are secrets or environment-specific settings and should stay in `.env.local` or your deployment platform's secret manager.

## 4. Local Verification

Before deploying, run:

```bash
pnpm lint
pnpm build
pnpm lint:posts
pnpm sync:posts -- --check
```

What each command protects:

- `pnpm lint`: catches code, JSX, and accessibility issues
- `pnpm build`: validates production compilation and route generation
- `pnpm lint:posts`: verifies post metadata
- `pnpm sync:posts -- --check`: ensures `posts/manifest.json` is in sync

## 5. Editor Access

If `EDITOR_ACCESS_TOKEN` is empty, `/editor` stays open locally.
If it is set, the editor requires one successful unlock in the browser and then stores an HttpOnly session cookie.

Relevant files:

- [app/editor/page.tsx](E:/wangqiwen.me/app/editor/page.tsx)
- [app/api/editor/session/route.ts](E:/wangqiwen.me/app/api/editor/session/route.ts)
- [utils/server/editor-auth.ts](E:/wangqiwen.me/utils/server/editor-auth.ts)
- [INIT.md](E:/wangqiwen.me/INIT.md)
- [OPERATIONS.md](E:/wangqiwen.me/OPERATIONS.md)

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

After deployment, double-check:

- homepage metadata
- `/about`
- one article page
- `/opengraph-image`
- `/about/opengraph-image`
- `/editor`

## 7. Self-Hosted Deploy

Any Node 18+ environment that can run `pnpm install && pnpm build && pnpm start` should work.

For low-memory Ubuntu servers, the recommended deployment model is:

1. build on another machine or CI runner
2. upload a prebuilt standalone artifact
3. let the server only extract and run that artifact

This repo is configured to produce a Next.js standalone bundle, and the deployment scripts now support that flow directly.

## 8. Build The Artifact Elsewhere

Run this on your laptop, workstation, or CI runner:

```bash
bash scripts/build-deploy-artifact.sh
```

The script will:

- install dependencies unless `SKIP_INSTALL=1`
- synchronize and validate post metadata
- run `next build`
- package a standalone deployment tarball into `dist/`

Useful env vars for the build step:

- `ARTIFACT_DIR=dist` changes the output directory
- `ARTIFACT_NAME=my-site.tar.gz` overrides the generated file name
- `SKIP_INSTALL=1` skips `pnpm install --frozen-lockfile`
- `RUN_LINT_POSTS=0` skips `pnpm lint:posts`

The artifact includes:

- the standalone Node.js server from `.next/standalone`
- `.next/static`
- `public/`
- the runtime source files needed by the local editor and content sync flows

## 9. First-Time Ubuntu Server Setup

Keep a small bootstrap checkout on the server so the deployment scripts are always available:

```bash
sudo apt-get update
sudo apt-get install -y git
git clone https://github.com/your-name/your-repo.git ~/blog-bootstrap
cd ~/blog-bootstrap
```

Upload the build artifact from your local machine:

```bash
scp dist/<artifact>.tar.gz root@your-server:/tmp/
scp .env.production root@your-server:/tmp/prod.env
```

Then run the all-in-one provision script:

```bash
sudo env \
  APP_NAME=your-site \
  SERVICE_USER=blog \
  DOMAIN=your-domain.com \
  SERVER_ALIASES=www.your-domain.com \
  ENABLE_HTTPS=1 \
  CERTBOT_EMAIL=you@example.com \
  ENV_FILE_PATH=/tmp/prod.env \
  ARTIFACT_TARBALL=/tmp/<artifact>.tar.gz \
  bash scripts/provision-ubuntu.sh
```

The provision script can automatically:

- install Node.js, Nginx, PM2, and optional Certbot
- create the service user and deploy directories
- deploy the uploaded artifact without building on the server
- configure Nginx as a reverse proxy
- request HTTPS with Certbot when `ENABLE_HTTPS=1`

Useful env vars for the all-in-one flow:

- `APP_NAME=your-site` names the PM2 process, so you will see this name in `pm2 list`
- `SERVICE_USER=blog` is the Linux service account that owns and runs the app
- `SERVICE_HOME` is derived as `/srv/{SERVICE_USER}`
- `APP_DIR` is derived as `{SERVICE_HOME}/{APP_NAME}`
- `DOMAIN=your-domain.com` is the primary public domain for Nginx and HTTPS
- `SERVER_ALIASES=www.your-domain.com` adds extra hostnames to the Nginx `server_name`
- `ARTIFACT_TARBALL=/tmp/<artifact>.tar.gz` points at the uploaded build artifact
- `ARTIFACT_URL=https://example.com/my-site.tar.gz` lets the server download the artifact directly
- `ENV_FILE_PATH=/tmp/prod.env` copies a production env file into `APP_DIR/.env.local` before the first deploy
- `ENABLE_HTTPS=1` requests HTTPS automatically
- `CERTBOT_EMAIL=you@example.com` sets the Let's Encrypt contact email
- `RUN_INSTALL=0` skips environment bootstrap
- `RUN_DEPLOY=0` skips artifact deployment
- `RUN_SITE_CONFIG=0` skips the Nginx / HTTPS step

What the example command means:

- `APP_NAME=your-site`: PM2 process name only. This is not your Unix user and not your directory path.
- `SERVICE_USER=blog`: the dedicated system user that will own files and run the Node.js process.
- `SERVICE_HOME`: auto-derived to `/srv/blog`.
- `APP_DIR`: auto-derived to `/srv/blog/your-site`.
- `DOMAIN=your-domain.com`: the main site domain served by Nginx.
- `SERVER_ALIASES=www.your-domain.com`: additional domains that should point to the same site.
- `ARTIFACT_TARBALL=/tmp/<artifact>.tar.gz`: the uploaded deployment package produced by `build-deploy-artifact.sh`.
- `ENV_FILE_PATH=/tmp/prod.env`: an existing env file on the server that should become `APP_DIR/.env.local`.
- `ENABLE_HTTPS=1`: tells the script to run Certbot and configure TLS automatically.
- `CERTBOT_EMAIL=you@example.com`: contact email used by Let's Encrypt for expiry and recovery notices.

The provision script still depends on two external prerequisites:

- your DNS must already point the domain at this server before HTTPS issuance
- your cloud firewall or security-group rules must allow ports `80` and `443`

## 10. Step-By-Step Manual Setup

If you prefer explicit control instead of the all-in-one provision script:

```bash
cd ~/blog-bootstrap
sudo env APP_NAME=your-site SERVICE_USER=blog bash scripts/install-ubuntu-env.sh
sudo install -d -o blog -g blog /srv/blog/your-site
sudo -u blog -H cp .env.example /srv/blog/your-site/.env.local
sudo env APP_NAME=your-site SERVICE_USER=blog ARTIFACT_TARBALL=/tmp/<artifact>.tar.gz bash scripts/deploy-ubuntu.sh
sudo env DOMAIN=your-domain.com SERVER_ALIASES=www.your-domain.com APP_PORT=3000 ENABLE_HTTPS=1 CERTBOT_EMAIL=you@example.com bash scripts/configure-ubuntu-site.sh
```

The install script will:

- install Node.js from NodeSource
- enable corepack and pnpm
- install Nginx and PM2
- create a dedicated service user
- prepare `/srv/{SERVICE_USER}`, `/srv/{SERVICE_USER}/{APP_NAME}`, and shared directories

The deploy script will:

- switch to `SERVICE_USER` automatically if needed
- extract the standalone artifact into `APP_DIR`
- preserve `.env`, `.env.production`, and `.env.local` if they already exist
- keep the previous release as a timestamped backup
- restart the PM2 process by running `server.js`

The site script will:

- create or update an Nginx site file
- reverse proxy traffic from port `80` to `127.0.0.1:3000`
- enable the site
- disable the default Nginx site by default
- validate and reload Nginx

Useful env vars for the public site step:

- `DOMAIN=your-domain.com` sets the primary domain
- `SERVER_ALIASES=www.your-domain.com` adds extra names to `server_name`
- `APP_PORT=3000` changes the local app port that Nginx proxies to
- `APP_HOST=127.0.0.1` changes the local app host that Nginx proxies to
- `ENABLE_HTTPS=1` asks Certbot to configure HTTPS automatically
- `CERTBOT_EMAIL=you@example.com` sets the Let's Encrypt contact email
- `REMOVE_DEFAULT_SITE=0` keeps the default Nginx site enabled
- `CLIENT_MAX_BODY_SIZE=32m` changes the upload limit for Nginx

Make sure your production environment variables are set before the first artifact deploy, typically in `APP_DIR/.env.local`.

## 11. Updating An Existing Server

For later releases, build a new artifact on your local machine or CI runner:

```bash
bash scripts/build-deploy-artifact.sh
scp dist/<artifact>.tar.gz root@your-server:/tmp/
```

Then deploy it on the server:

```bash
cd /srv/blog/your-site
sudo env APP_NAME=your-site SERVICE_USER=blog ARTIFACT_TARBALL=/tmp/<artifact>.tar.gz bash scripts/deploy-ubuntu.sh
```

If the update also changes your public domain, Nginx settings, upload limits, or HTTPS setup, run the site script again after the deploy:

```bash
cd ~/blog-bootstrap
sudo env DOMAIN=your-domain.com SERVER_ALIASES=www.your-domain.com APP_PORT=3000 ENABLE_HTTPS=1 CERTBOT_EMAIL=you@example.com bash scripts/configure-ubuntu-site.sh
```

If you want to reuse the all-in-one provision script on an existing server, skip the install step:

```bash
cd ~/blog-bootstrap
sudo env \
  RUN_INSTALL=0 \
  APP_NAME=your-site \
  SERVICE_USER=blog \
  DOMAIN=your-domain.com \
  SERVER_ALIASES=www.your-domain.com \
  ARTIFACT_TARBALL=/tmp/<artifact>.tar.gz \
  bash scripts/provision-ubuntu.sh
```

One important operational note:

- the artifact replaces the contents of `APP_DIR`
- if you use the built-in editor to modify posts or uploaded assets on the server, make sure those changes are synced back to your source repo before the next release
