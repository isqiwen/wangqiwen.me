# Wang Qiwen Blog

This repository contains the source code for [wangqiwen.me](https://wangqiwen.me), a multilingual personal blog built with the Next.js App Router, React 19 RC builds, Tailwind CSS, MDX, SWR, and Upstash Redis.

If you want to turn this repository into your own site, read [DEPLOY.md](E:/wangqiwen.me/DEPLOY.md) first. It now documents the white-label flow, which parts are controlled by `site.config.js`, and which values must stay in environment variables.

## Prerequisites
- Node.js 18.18 or higher (matching the version supported by Next.js 15)
- [pnpm](https://pnpm.io/) 8+
- Optional: [Vercel CLI](https://vercel.com/docs/cli) for running the production-like preview locally

## Getting started
1. Install dependencies and copy the required font assets into `public/fonts`:
   ```bash
   pnpm install
   ```
   The `postinstall` hook runs `node fonts/init.mjs`, which mirrors the necessary font files from `node_modules` into `public/fonts`. The script now skips missing files gracefully, so dependency upgrades will no longer break installation.
2. Create a `.env.local` file with the required environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Then edit the file and fill in your Upstash Redis credentials.
3. Start the development server:
   ```bash
   pnpm dev
   ```
   The dev server binds to `http://0.0.0.0:3000`, so it is reachable from other devices on the same network.

## Available scripts
- `pnpm dev` – Start the local development server with Turbopack.
- `pnpm lint` – Run ESLint with the configuration provided by Next.js.
- `pnpm generate:english` – Translate Chinese MDX posts into the English content tree. Use `--force` to overwrite existing files or `--dry-run` to preview the changes. You can scope the run with `--year 2024`, `--id foo`, or `--post 2024/foo`, and `--changed` will only process posts touched in `git status`.
- `pnpm new:post --id my-post [--date 2024-12-01] [--with-en]` – Scaffold a new article directory with boilerplate metadata. It creates the Chinese version by default and, when `--with-en` is provided, also seeds an English draft.
- `pnpm sync:posts` – Normalize every article’s metadata and rebuild `posts/manifest.json` so the runtime can load posts quickly without scanning MDX files.
- `pnpm sync:posts -- --check` – Same as above but only verifies whether files/manifest are in sync (non-zero exit on diff); ideal for CI.
- `pnpm lint:posts` – Validate that metadata exists (`title`, `id`, `publishedAt`) and that IDs are unique across languages; fails with a non-zero exit code when issues are found.
- `pnpm backup:content` – Create a timestamped content backup covering posts, manifest, public images, site config, and links.
- `pnpm reset:content -- --force` – Back up the current content and reset the repository to a blank starter state.
- `pnpm build` – Produce an optimized production build.
- `pnpm start` – Serve the production build locally after running `pnpm build`.

## Deployment
The project is designed for Vercel, but any platform that can run `pnpm install && pnpm build` with Node.js ≥ 18 will work.

To test a Vercel-like environment locally:
```bash
vercel login          # first time only
vercel link           # first time only
vercel dev            # preview environment
vercel --prod         # production deployment
```

## Environment variables
| Variable | Description |
| --- | --- |
| `UPSTASH_REDIS_REST_URL` | Upstash REST endpoint used by the Redis helper at `app/redis.ts`. |
| `UPSTASH_REDIS_REST_TOKEN` | Authentication token paired with the endpoint above. |
| `UPSTASH_REDIS_FORCE_REMOTE` | Optional. Set to `1` in development if you want to hit the real Upstash instance instead of the default in-memory mock. |
| `GEO_IP_API_KEY` | Optional key for the demo endpoint at `app/api/geo/route.ts`. |
| `EDITOR_ACCESS_TOKEN` | Optional password protecting `/editor` and its write APIs. |

## Project structure
- `app/` – App Router routes. `layout.tsx` sets up global theming, language detection, analytics, and scripts. `page.tsx` renders the homepage, while `app/(post)/` contains article layouts and MDX content by locale.
- `app/api/` – Route handlers backing features like post listings (`posts`), view counters (`view`), and the geolocation demo (`geo`).
- `locales/` – Dictionaries, middleware helpers, and provider utilities for internationalisation.
- `utils/` – Shared utilities used across the server and client, such as language detection and formatting helpers.
- `styles/`, `tailwind.config.js`, `postcss.config.js` – Styling system configuration.
- `mdx-components.ts` – Mapping of MDX elements to React components used in blog posts.

## Writing workflow (Chinese-first)
1. Use `pnpm new:post --id my-post [--with-en]` to scaffold the folders and metadata. It creates `app/(post)/zh/<year>/<id>/page.mdx` by default and can optionally add an English draft.
2. After editing, run `pnpm sync:posts` to normalize every article’s metadata and regenerate `posts/manifest.json`, so the runtime can load posts without re-scanning MDX files. In CI you can run `pnpm sync:posts -- --check` to ensure the manifest is up to date without modifying the tree.
3. Before committing, run `pnpm lint:posts` to verify that `title`, `id`, and `publishedAt` exist and that IDs remain unique across languages.
4. When the English version is ready, run `pnpm generate:english --post <year>/<id>` (or use `--year`/`--id`/`--changed`) to translate only the articles you touched.
5. The translation script caches Google Translate responses in `.translation-cache.json`; the file is ignored by git and reused on the next run.

## Local dev setup
- macOS / Linux:
  ```bash
  bash scripts/setup-dev.sh
  ```
  This enables corepack (pnpm), installs dependencies, and copies `.env.example` to `.env.local` if missing.
- Windows (PowerShell):
  ```powershell
  pwsh -File scripts/setup-dev.ps1
  ```
  Same steps as above, but tailored for Windows shells.

After setup, start the dev server with:
```bash
pnpm dev --filter blog
```

### MDX editor
Visit `/editor` while the dev server is running. It provides:
- Metadata form (locale, title, description, summary, series, publishedAt, updatedAt, id, featured, status).
- MDX textarea with direct save/load support.
- Image asset panel with upload, preview, copy-path, insert, cover selection, and delete actions.
- Optional unlock flow when `EDITOR_ACCESS_TOKEN` is configured.
- Local autosave, unsaved-change warnings, recent draft restore, and archived post management.
The editor can write files through the local API routes, so it is best treated as an authoring tool rather than a public CMS.

## White-labeling
- Update public identity and About copy in `site.config.js`.
- Keep Redis, Geo API, and editor secrets in `.env.local` or your hosting provider's secret manager.
- Replace old posts, links, and media assets if you want a fully clean personal rebrand.
- Use [DEPLOY.md](E:/wangqiwen.me/DEPLOY.md) as the full checklist before launch.
- Use [INIT.md](E:/wangqiwen.me/INIT.md) to start from a blank personal-site template.
- Use [OPERATIONS.md](E:/wangqiwen.me/OPERATIONS.md) for health checks, editor guardrails, backups, and restore steps.

## Ubuntu server deploy (self-hosted)
If you deploy on your own Ubuntu box (Node 18+, corepack enabled, env vars ready), use:
```bash
bash scripts/deploy-ubuntu.sh
```
What it does:
- `git pull --ff-only`
- `corepack enable` + `pnpm install --frozen-lockfile`
- `pnpm build`
- Restarts via `pm2` if available (`pm2 restart wangqiwen-blog || pm2 start pnpm --name wangqiwen-blog -- start`); otherwise it will print a manual `pnpm start` hint.

## Future development ideas
- Add automated checks that validate MDX front matter so the post index stays healthy.
- Add visual regression tests or Storybook stories for `app/(post)/components` to safeguard design changes.
- Expand the CI pipeline beyond the current lint/build/post checks with test and preview validation.
- Implement local mocks for the `/api/view` endpoint so contributors can test analytics features without an Upstash account.
