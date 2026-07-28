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

## Runtime Permissions

Expected ownership:

```text
/srv/nextjs                  nextjs:nextjs
/srv/nextjs/shared           nextjs:nextjs
/srv/nextjs/logs             nextjs:nextjs
/srv/nextjs/wangqiwen-me     nextjs:nextjs
```

The systemd service runs as `nextjs`, so owner write permission is enough for runtime files and editor uploads.

Typical directory modes:

```text
/srv/nextjs                  755
/srv/nextjs/shared           755
/srv/nextjs/logs             755
/srv/nextjs/wangqiwen-me     755
```

`775` on `/srv/nextjs/wangqiwen-me` is acceptable only when the `nextjs` group is not shared with normal shell users. Check group membership with:

```bash
getent group nextjs
```

The production env file should stay private:

```bash
sudo chown nextjs:nextjs /srv/nextjs/wangqiwen-me/.env.local
sudo chmod 600 /srv/nextjs/wangqiwen-me/.env.local
```

## Health Monitoring

The app exposes:

- `GET /api/health`

In production it reports only the overall `ok` or `degraded` status and a
timestamp. Detailed environment checks remain available during development and
are written to the server log without exposing configuration state publicly.

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

- `pnpm check` is green
- `pnpm audit --prod --audit-level high` is green
- `pnpm build` is green
- `EDITOR_ACCESS_TOKEN` is set in production
- Redis credentials are configured if persistent counters are required

After release:

- `sudo systemctl status wangqiwen-me` shows `active (running)`
- `/api/health` returns `200`
- the deploy script reports `Health check passed`
- `https://wangqiwen.me` loads from outside the VPS
- Caddy logs do not show certificate or upstream errors

Artifact deployments retain the previous app directory at
`/srv/nextjs/.wangqiwen-me.rollback`. If the new service fails to start or does
not pass `/api/health`, the deploy script restores that release automatically.

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

## Production Editor Content

On the VPS, `/editor` writes under the app working directory:

```text
/srv/nextjs/wangqiwen-me/app/(post)/YYYY/slug/page.mdx
/srv/nextjs/wangqiwen-me/public/images/<post-id>/...
/srv/nextjs/wangqiwen-me/posts/manifest.json
```

These files are inside the deployed artifact directory. They are not automatically committed to Git, and the artifact directory normally has no `.git` folder.

The editor is useful for local or development-machine authoring. In the current standalone production architecture, it is not a complete CMS:

- the homepage and post list can read updated manifest metadata
- uploaded images can be written to the VPS filesystem
- MDX article pages are compiled during `next build`, so changed or new `page.mdx` content requires a rebuild and redeploy to be reliable publicly
- a future artifact deploy can overwrite unsynced production edits

If production editor changes must be kept, copy them back to the source repo before deploying again. From the local repo root:

```bash
rsync -av 'qiwen@wangqiwen.me:/srv/nextjs/wangqiwen-me/app/(post)/' 'app/(post)/'
rsync -av 'qiwen@wangqiwen.me:/srv/nextjs/wangqiwen-me/public/images/' 'public/images/'
scp qiwen@wangqiwen.me:/srv/nextjs/wangqiwen-me/posts/manifest.json posts/manifest.json
pnpm sync:posts
git status
```

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
