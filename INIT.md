# Initialization Guide

Use this guide when you want to turn the repository into a fresh personal site instead of inheriting the current content.

## 1. Back Up Or Start Fresh

To create a snapshot of the current posts, manifest, images, site config, and links:

```bash
pnpm backup:content
```

If you want a blank starter instead of the bundled content, run:

```bash
pnpm reset:content -- --force
```

That command will:

- create a backup first
- remove all post directories under `app/(post)/<year>`
- clear article image folders under `public/images`
- preserve the neutral avatar placeholder files
- reset `posts/manifest.json`
- clear `links.json`

## 2. Rebrand The Site

Update [site.config.js](site.config.js):

- `site.*`
- `author.*`
- `social.*`
- `project.sourceUrl`
- `navigation.*`
- `home.*`
- `footer.*`
- `about.*`
- `opengraph.*`

## 3. Replace Images

Replace the default placeholder files if you want your own portrait:

- `/public/images/avatar-placeholder.svg`
- `/public/images/avatar-placeholder-muted.svg`

Post-specific assets will be uploaded by the editor into `/public/images/<post-id>/`.

## 4. Configure Environment Variables

Copy the sample file and fill in your real values:

```bash
cp .env.example .env.local
```

Recommended variables:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `EDITOR_ACCESS_TOKEN`

Optional variables:

- `GEO_IP_API_KEY`
- `UPSTASH_REDIS_FORCE_REMOTE`

If you prefer a scripted local setup first, run one of these:

```bash
bash scripts/setup-dev.sh
```

```powershell
pwsh ./scripts/setup-dev.ps1
```

## 5. Create Your First Content

Create a starter article:

```bash
pnpm new:post --id my-first-post
```

Then use `/editor` to continue writing, upload images, and publish.

## 6. Verify Before Deploying

Run:

```bash
pnpm lint
pnpm lint:posts
pnpm sync:posts -- --check
pnpm build
```

## 7. Operational Basics

Before putting the site on a real server:

- configure `EDITOR_ACCESS_TOKEN`
- monitor `/api/health`
- create regular backups with `pnpm backup:content`
- review [OPERATIONS.md](OPERATIONS.md)
