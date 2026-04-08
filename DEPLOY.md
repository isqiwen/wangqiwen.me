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

On Ubuntu, you can use:

```bash
APP_NAME=my-blog bash scripts/deploy-ubuntu.sh
```

The script will:

- pull the latest code
- install dependencies with pnpm
- synchronize and validate post metadata
- build the app
- restart a PM2 process named by `APP_NAME`

Make sure your production environment variables are set before running the script.
