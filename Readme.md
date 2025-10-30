# Wang Qiwen Blog

This repository contains the source code for [wangqiwen.me](https://wangqiwen.me), a multilingual personal blog built with the Next.js App Router, React 19 RC builds, Tailwind CSS, MDX, SWR, and Upstash Redis.

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
| `GEO_IP_API_KEY` | Optional key for the demo endpoint at `app/api/geo/route.ts`. |

## Project structure
- `app/` – App Router routes. `layout.tsx` sets up global theming, language detection, analytics, and scripts. `page.tsx` renders the homepage, while `app/(post)/` contains article layouts and MDX content by locale.
- `app/api/` – Route handlers backing features like post listings (`posts`), view counters (`view`), and the geolocation demo (`geo`).
- `locales/` – Dictionaries, middleware helpers, and provider utilities for internationalisation.
- `utils/` – Shared utilities used across the server and client, such as language detection and formatting helpers.
- `styles/`, `tailwind.config.js`, `postcss.config.js` – Styling system configuration.
- `mdx-components.ts` – Mapping of MDX elements to React components used in blog posts.

## Future development ideas
- Add automated checks that validate MDX front matter so the post index stays healthy.
- Add visual regression tests or Storybook stories for `app/(post)/components` to safeguard design changes.
- Expand the CI pipeline with `pnpm lint` and `pnpm build` to catch issues before merging pull requests.
- Implement local mocks for the `/api/view` endpoint so contributors can test analytics features without an Upstash account.
