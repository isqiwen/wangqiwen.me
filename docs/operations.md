# Operations Runbook

Production runbook for the self-hosted `wangqiwen.me` VPS.

Use [deployment.md](deployment.md) to release code. Use this file after deploys, during incidents, or before content recovery.

## Runtime

| Item | Value |
| --- | --- |
| App directory | `/srv/nextjs/wangqiwen-me` |
| Service user | `nextjs` |
| systemd service | `wangqiwen-me.service` |
| App listener | `127.0.0.1:3000` |
| Public proxy | Caddy |
| Caddy site file | `/etc/caddy/Caddyfile.d/wangqiwen.me.caddy` |
| Production env | `/srv/nextjs/wangqiwen-me/.env.local` |

The app listens only on localhost. Public traffic enters through Caddy on `80/tcp` and `443/tcp`.

The deploy SSH user is `qiwen` by default. It needs passwordless sudo for install, systemd, and Caddy changes:

```bash
ssh qiwen@wangqiwen.me 'sudo -n true'
```

If needed, configure it on the VPS with:

```bash
sudo visudo -f /etc/sudoers.d/wangqiwen-deploy
```

```text
qiwen ALL=(root) NOPASSWD: ALL
```

The deploy script reuses one SSH connection by default, so password-based SSH should normally prompt once per deploy. SSH keys are still preferred.

Keep production secrets private:

```bash
sudo chown nextjs:nextjs /srv/nextjs/wangqiwen-me/.env.local
sudo chmod 600 /srv/nextjs/wangqiwen-me/.env.local
```

## Health Checks

On the VPS:

```bash
sudo systemctl status wangqiwen-me
sudo journalctl -u wangqiwen-me -n 100 --no-pager
curl -s http://127.0.0.1:3000/api/health
```

From outside:

```bash
curl -I https://wangqiwen.me
curl -s https://wangqiwen.me/api/health
```

How to split failures:

- `http://127.0.0.1:3000` fails: app, env, or systemd problem
- localhost works but public HTTPS fails: Caddy, DNS, certificate, or firewall problem

## Service Commands

App:

```bash
sudo systemctl restart wangqiwen-me
sudo journalctl -u wangqiwen-me -f
```

Caddy:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
sudo systemctl status caddy
sudo journalctl -u caddy -n 100 --no-pager
```

## Production Env

Production secrets live on the VPS at:

```text
/srv/nextjs/wangqiwen-me/.env.local
```

Set this once and update it only when values change. Normal code-only deploys keep the VPS env file by default:

```bash
pnpm deploy:vps
```

When values change, upload `.env.production` explicitly:

```bash
UPLOAD_ENV=1 pnpm deploy:vps
```

Required in production:

```text
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
EDITOR_ACCESS_TOKEN=
```

Optional:

```text
GEO_IP_API_KEY=
```

## Deploy Safety

`pnpm deploy:vps` installs the new artifact into a temporary directory, swaps it into `/srv/nextjs/wangqiwen-me`, restarts `wangqiwen-me.service`, and checks `/api/health`.

If restart or health check fails, the deploy script restores the previous release automatically from:

```text
/srv/nextjs/.wangqiwen-me.rollback
```

Do not run multiple deploys at the same time.

## Production Editor Content

Use [editor.md](editor.md) for the article authoring and status workflow. This section covers only production file persistence and recovery.

On the VPS, `/editor` writes inside the deployed app directory:

```text
/srv/nextjs/wangqiwen-me/app/(post)/YYYY/slug/page.mdx
/srv/nextjs/wangqiwen-me/public/images/<post-id>/...
/srv/nextjs/wangqiwen-me/posts/manifest.json
```

Those files are not committed to Git. A later artifact deploy can overwrite unsynced production edits.

If production editor changes must be kept, sync them back before the next deploy:

```bash
rsync -av 'qiwen@wangqiwen.me:/srv/nextjs/wangqiwen-me/app/(post)/' 'app/(post)/'
rsync -av 'qiwen@wangqiwen.me:/srv/nextjs/wangqiwen-me/public/images/' 'public/images/'
scp qiwen@wangqiwen.me:/srv/nextjs/wangqiwen-me/posts/manifest.json posts/manifest.json
pnpm sync:posts
git status
```

## Backups

Create a content backup:

```bash
pnpm backup:content
```

The backup includes:

- `app/(post)`
- `posts/manifest.json`
- `public/images`
- `site.config.js`
- `links.json`

Restore flow:

1. Copy the saved files back into the repo.
2. Run `pnpm sync:posts`.
3. Run `pnpm build`.
4. Deploy a new artifact.
