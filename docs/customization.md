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

Update [site.config.js](../site.config.js):

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

No environment file is required for the default local workflow. Create one only when you need real external services or local editor password protection:

```bash
cp .env.example .env.local
```

Recommended variables:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Optional variables:

- `GEO_IP_API_KEY`
- `UPSTASH_REDIS_FORCE_REMOTE`
- `EDITOR_ACCESS_TOKEN`

If you prefer a scripted local setup first, run one of these:

```bash
bash scripts/dev/setup.sh
```

```powershell
pwsh ./scripts/dev/setup.ps1
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
pnpm check
pnpm audit --prod --audit-level high
pnpm build
```

## 7. Operational Basics

Before putting the site on a real server:

- monitor `/api/health`
- create regular backups with `pnpm backup:content`
- review [operations.md](operations.md)
