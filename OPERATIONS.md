# Operations Guide

This document covers the production guardrails and day-to-day checks for the self-hosted `wangqiwen.me` deployment.

## Runtime Layout

Default production layout:

| Item | Value |
| --- | --- |
| App directory | `/srv/nextjs/wangqiwen-me` |
| Service user | `nextjs` |
| systemd service | `wangqiwen-me.service` |
| App listener | `127.0.0.1:3000` |
| Public reverse proxy | Caddy |
| Caddy site file | `/etc/caddy/Caddyfile.d/wangqiwen.me.caddy` |

The app listens only on localhost. Public traffic enters through Caddy on `80/tcp` and `443/tcp`.

## Health Monitoring

The app exposes:

- `GET /api/health`

It reports:

- environment configuration state for Redis, editor protection, and Geo IP
- whether the Redis adapter responds to a lightweight runtime check
- overall status as `ok` or `degraded`

Checks from the VPS:

```bash
curl -I http://127.0.0.1:3000
curl -s http://127.0.0.1:3000/api/health
```

Checks from the public internet:

```bash
curl -I https://wangqiwen.me
curl -s https://wangqiwen.me/api/health
```

## systemd Commands

Application status:

```bash
sudo systemctl status wangqiwen-me
```

Restart the app:

```bash
sudo systemctl restart wangqiwen-me
```

Follow app logs:

```bash
sudo journalctl -u wangqiwen-me -f
```

Recent app logs:

```bash
sudo journalctl -u wangqiwen-me -n 100 --no-pager
```

If the app service is running but the public site is unavailable, check Caddy next.

## Caddy Commands

Validate config:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
```

Reload Caddy:

```bash
sudo systemctl reload caddy
```

Check Caddy status and logs:

```bash
sudo systemctl status caddy
sudo journalctl -u caddy -n 100 --no-pager
```

Common split:

- `curl http://127.0.0.1:3000` fails: app or systemd problem
- `curl http://127.0.0.1:3000` works but public HTTPS fails: Caddy, DNS, certificate, or firewall problem

## Deployment Checklist

Before release:

- `pnpm lint` is green
- `pnpm lint:posts` is green
- `pnpm sync:posts -- --check` is green
- `pnpm build` is green
- `EDITOR_ACCESS_TOKEN` is set in production
- Redis credentials are configured if persistent counters are required

After release:

- `sudo systemctl status wangqiwen-me` shows `active (running)`
- `/api/health` returns `200`
- `https://wangqiwen.me` loads from outside the VPS
- Caddy logs do not show certificate or upstream errors

## Editor API Guardrails

The editor routes have:

- per-IP in-memory rate limits
- structured log messages
- consistent JSON error payloads

Protected routes include:

- `/api/editor`
- `/api/editor/assets`
- `/api/editor/list`
- `/api/editor/publish`
- `/api/editor/session`
- `/api/editor/upload`

The current rate limiter is in-memory. It is enough for a single-node deployment, but if the app later runs multiple instances, move the limiter to Redis or another shared store.

## Environment Warnings

The server logs actionable warnings when these settings are missing:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `EDITOR_ACCESS_TOKEN`
- `GEO_IP_API_KEY`

Those warnings make startup and first-request failures easier to understand.

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
- before replacing production content that has been edited through `/editor`

The deployment artifact replaces the contents of `/srv/nextjs/wangqiwen-me`. If production editor changes should be kept, sync them back to the source repo before deploying the next artifact.

## Restore Strategy

To restore from a backup:

1. copy the saved `app/(post)`, `posts/manifest.json`, `public/images`, `site.config.js`, and `links.json` back into the repo
2. run `pnpm sync:posts`
3. run `pnpm build`
4. deploy a new artifact
5. restart the app if needed
