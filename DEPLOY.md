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

For a fresh Ubuntu 24.04 server, the fastest path is the all-in-one provision script:

```bash
sudo apt-get update
sudo apt-get install -y git
git clone https://github.com/your-name/your-repo.git ~/blog-bootstrap
cd ~/blog-bootstrap
```

Then run:

```bash
sudo env \
  APP_NAME=my-blog \
  DOMAIN=example.com \
  SERVER_ALIASES=www.example.com \
  ENABLE_HTTPS=1 \
  CERTBOT_EMAIL=admin@example.com \
  bash scripts/provision-ubuntu.sh
```

The provision script can automatically:

- install Node.js, pnpm, Nginx, PM2, and optional Certbot
- create the `nextjs` service user and `/srv/nextjs/app`
- clone the repo if it is not already present
- build and start the app with PM2
- configure Nginx as a reverse proxy
- request HTTPS with Certbot when `ENABLE_HTTPS=1`

Useful env vars for the all-in-one flow:

- `REPO_URL=https://github.com/your-name/your-repo.git` sets the Git remote used for the initial clone
- `REPO_BRANCH=main` clones a specific branch
- `APP_NAME=my-blog` names the PM2 process
- `DOMAIN=example.com` sets the primary public domain
- `SERVER_ALIASES=www.example.com` adds extra hostnames
- `ENABLE_HTTPS=1` requests HTTPS automatically
- `CERTBOT_EMAIL=admin@example.com` sets the Let's Encrypt contact email
- `RUN_INSTALL=0` skips environment bootstrap
- `RUN_DEPLOY=0` skips app deployment
- `RUN_SITE_CONFIG=0` skips the Nginx / HTTPS step

If `REPO_URL` is omitted, the provision script uses the current checkout's `origin` remote. That is why the bootstrap checkout above is enough for a fresh machine.

The provision script still depends on two external prerequisites:

- your DNS must already point the domain at this server before HTTPS issuance
- your cloud firewall or security-group rules must allow ports `80` and `443`

If you prefer explicit step-by-step control, use the scripts below instead.

For a fresh Ubuntu 24.04 server, bootstrap the machine first:

```bash
sudo apt-get update
sudo apt-get install -y git
git clone https://github.com/your-name/your-repo.git ~/blog-bootstrap
cd ~/blog-bootstrap
sudo bash scripts/install-ubuntu-env.sh
```

What the bootstrap script installs:

- Node.js from NodeSource
- corepack and pnpm
- Nginx
- PM2
- common deployment packages like `git`, `curl`, and `build-essential`
- `certbot` and the Nginx plugin by default
- a dedicated system user `nextjs` with home directory `/srv/nextjs`
- an application directory at `/srv/nextjs/app`

Useful env vars for the bootstrap step:

- `NODE_MAJOR=20` selects the Node.js major version
- `SERVICE_USER=nextjs` changes the service user name
- `SERVICE_HOME=/srv/nextjs` changes the service user home
- `APP_DIR=/srv/nextjs/app` changes the repo directory
- `INSTALL_CERTBOT=0` skips Certbot packages
- `INSTALL_UFW=1` installs UFW and opens SSH / Nginx rules

The service user is created with:

```bash
sudo adduser --system --group --home /srv/nextjs --shell /usr/sbin/nologin nextjs
```

After bootstrap, clone the repo as that user:

```bash
sudo -u nextjs -H git clone <repo-url> /srv/nextjs/app
```

Once the server is ready, deploy the app with:

```bash
cd /srv/nextjs/app
sudo -u nextjs -H env APP_NAME=my-blog bash scripts/deploy-ubuntu.sh
```

The deploy script will:

- switch to `APP_USER` automatically if needed
- pull the latest code
- install dependencies with pnpm
- synchronize and validate post metadata
- build the app
- restart a PM2 process named by `APP_NAME`
- persist the PM2 process list with `pm2 save`

To expose the app on the public internet, configure Nginx:

```bash
cd /srv/nextjs/app
sudo env DOMAIN=example.com SERVER_ALIASES=www.example.com APP_PORT=3000 bash scripts/configure-ubuntu-site.sh
```

The site script will:

- create or update an Nginx site file
- reverse proxy traffic from port `80` to `127.0.0.1:3000`
- enable the site
- disable the default Nginx site by default
- validate and reload Nginx

To request HTTPS after your DNS already points at the server:

```bash
cd /srv/nextjs/app
sudo env DOMAIN=example.com SERVER_ALIASES=www.example.com APP_PORT=3000 ENABLE_HTTPS=1 CERTBOT_EMAIL=admin@example.com bash scripts/configure-ubuntu-site.sh
```

Useful env vars for the public site step:

- `DOMAIN=example.com` sets the primary domain
- `SERVER_ALIASES=www.example.com` adds extra names to `server_name`
- `APP_PORT=3000` changes the local app port that Nginx proxies to
- `APP_HOST=127.0.0.1` changes the local app host that Nginx proxies to
- `ENABLE_HTTPS=1` asks Certbot to configure HTTPS automatically
- `CERTBOT_EMAIL=admin@example.com` sets the Let's Encrypt contact email
- `REMOVE_DEFAULT_SITE=0` keeps the default Nginx site enabled
- `CLIENT_MAX_BODY_SIZE=32m` changes the upload limit for Nginx

Make sure your production environment variables are set before running the script.
Also make sure your domain DNS and any cloud security-group rules already allow ports `80` and `443`, otherwise HTTPS issuance will fail.
After the final deploy is running from `/srv/nextjs/app`, you can remove the temporary `~/blog-bootstrap` checkout.
