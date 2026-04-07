# Operations Guide

This document covers the lightweight production guardrails included in the repository today.

## Health Monitoring

The app now exposes a basic runtime health endpoint:

- `GET /api/health`

It reports:

- environment configuration state for Redis, editor protection, and Geo IP
- whether the Redis adapter responds to a lightweight runtime check
- overall status as `ok` or `degraded`

Use this endpoint for:

- uptime checks
- deployment smoke checks
- simple alerting in platforms like Uptime Kuma, Better Stack, Pingdom, or a cron job

## Editor API Guardrails

The editor routes now have:

- per-IP in-memory rate limits
- clearer structured log messages
- consistent JSON error payloads

Protected routes include:

- `/api/editor`
- `/api/editor/assets`
- `/api/editor/list`
- `/api/editor/publish`
- `/api/editor/session`
- `/api/editor/upload`

Note: the current rate limiter is in-memory. It is enough for a single-node deployment, but if you later run multiple instances, move the limiter to Redis or another shared store.

## Environment Warnings

The server logs actionable warnings when these settings are missing:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `EDITOR_ACCESS_TOKEN`
- `GEO_IP_API_KEY`

Those warnings are designed to make startup and first-request failures easier to understand.

## Backup Strategy

Create a content backup with:

```bash
pnpm backup:content
```

That backup includes:

- `app/(post)`
- `posts/manifest.json`
- `public/images`
- `site.config.js`
- `links.json`

Recommended cadence:

- before running `pnpm reset:content -- --force`
- before major content edits or migrations
- daily or weekly on a self-hosted production machine

For hosted environments, store backups outside the app directory as well, for example:

- object storage
- a private backup repository
- scheduled filesystem snapshots

## Restore Strategy

To restore from a backup:

1. copy the saved `app/(post)`, `posts/manifest.json`, `public/images`, `site.config.js`, and `links.json` back into the repo
2. run `pnpm sync:posts`
3. run `pnpm build`
4. restart the app

## Deployment Checklist

- `EDITOR_ACCESS_TOKEN` is set in production
- `/api/health` returns `200` after deploy
- `pnpm backup:content` has been run recently
- `pnpm lint`, `pnpm lint:posts`, and `pnpm build` are green
- Redis credentials are configured if you want persistent counters
