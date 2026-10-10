# Operations Runbook

Production runbook for the self-hosted `wangqiwen.me` VPS.

Use [deployment.md](deployment.md) to release code. Use this file after deploys, during incidents, or before content recovery.

## Runtime

| Item            | Value                                       |
| --------------- | ------------------------------------------- |
| App directory   | `/srv/nextjs/wangqiwen-me`                  |
| Service user    | `nextjs`                                    |
| systemd service | `wangqiwen-me.service`                      |
| App listener    | `127.0.0.1:3000`                            |
| Public proxy    | Caddy                                       |
| Caddy site file | `/etc/caddy/Caddyfile` (two scoped site blocks) |
| Production env  | `/srv/nextjs/wangqiwen-me/.env.local`       |

The app listens only on localhost. Public traffic enters through Caddy on `80/tcp` and `443/tcp`.

The deploy SSH target is configured in `deploy.env`. A non-root SSH user needs passwordless sudo for installation and the app's systemd service; `root@…` is detected and runs without `sudo`. Caddy is changed only during first setup when this app's host blocks are missing or an approved conflicting block is replaced:

```bash
ssh <deploy-user>@wangqiwen.me 'sudo -n true'
```

If needed, configure it on the VPS with:

```bash
sudo visudo -f /etc/sudoers.d/wangqiwen-me-deploy
```

```text
<deploy-user> ALL=(root) NOPASSWD: ALL
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

## Search Discovery and External Monitoring

The site publishes these public discovery files:

```text
https://wangqiwen.me/sitemap.xml
https://wangqiwen.me/robots.txt
```

After a production deployment, add the production domain as a property in Google
Search Console, complete its ownership verification, then submit
`https://wangqiwen.me/sitemap.xml` in the Sitemaps report. Check the Pages report
and individual URL inspection over time: a sitemap helps Google discover URLs but
does not guarantee that they will be indexed.

Configure an external uptime monitor to make a public HTTPS `GET` request to:

```text
https://wangqiwen.me/api/health
```

Use a five-minute interval and a ten-second timeout. It should expect HTTP `200`.
Keep the monitor outside the VPS so it can also detect DNS, TLS, proxy, and
network failures.

The endpoint answers `200` whenever the application can serve pages. The body
reports the one optional dependency, the view-count store:

| `status`   | `views`       | Meaning                                                              |
| ---------- | ------------- | -------------------------------------------------------------------- |
| `ok`       | `ok`          | Everything works.                                                    |
| `ok`       | `disabled`    | No Redis credentials are set. Pages are served without view counts.  |
| `degraded` | `unavailable` | Redis is configured but did not answer within two seconds.           |

Pages never wait for Redis, so a `degraded` site still serves every page; only
the view counts are missing. A deployment is therefore not rolled back because
Redis is slow. To be alerted about Redis itself, add a keyword monitor for
`"status":"ok"`.

### UptimeRobot Setup

[UptimeRobot](https://uptimerobot.com/) is the recommended monitor for this
site. Create an `HTTP(s)` monitor with these settings:

| Setting                   | Value                             |
| ------------------------- | --------------------------------- |
| Friendly name             | `wangqiwen.me health`             |
| URL                       | `https://wangqiwen.me/api/health` |
| Monitoring interval       | 5 minutes                         |
| Request timeout           | 10 seconds                        |
| Internet Protocol version | `IPv4 / IPv6 (IPv4 Priority)`     |
| Follow redirections       | On                                |
| Up HTTP status codes      | `2xx` only; remove `3xx`          |
| Authentication            | None                              |

Assign your email notification contact to this monitor and enable both `Down`
and `Up` notifications. Without assigning a contact, the monitor can change
state without sending an alert. After creating it, wait for the first request:
`Up` means the endpoint returned a permitted response; `Down` means it timed
out, failed to connect, or returned a status outside `2xx`.

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

All values are optional. Without the first two the site runs without view counts:

```text
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
GEO_IP_API_KEY=
```

## How Pages Are Served

Every page, feed and sharing image is rendered once, when the artifact is
built. Content changes only with a deployment, so nothing is regenerated on the
server and no page waits for Redis. The browser asks `/api/view` and
`/api/posts/views` for the counts after the page has loaded.

Because of that, pages are sent with `Cache-Control: s-maxage=31536000`. Caddy
does not cache, so a new release is visible immediately. If a CDN or another
shared cache is ever placed in front of the site, purge its HTML on every
deployment; otherwise it may keep serving the previous release.

## Deploy Safety

`pnpm deploy:vps` installs the new artifact into a temporary directory, swaps it into `/srv/nextjs/wangqiwen-me`, restarts `wangqiwen-me.service`, and checks `/api/health`.

Normal releases do not touch Caddy. During `SETUP_SERVER=1`, Caddy handling is limited to the `wangqiwen.me` reverse proxy and `www.wangqiwen.me` redirect. Matching existing blocks are left unchanged; missing blocks are appended; conflicting standalone blocks require confirmation. The deploy script validates the full candidate file before a graceful reload and restores the original file if that reload fails. It never restarts Caddy as a fallback.

If restart or health check fails, the deploy script restores the previous release automatically from:

```text
/srv/nextjs/.wangqiwen-me.rollback
```

Do not run multiple deploys at the same time.

## Backups

Create a content backup:

```bash
pnpm backup:content
```

The backup includes:

- `content` (articles in `content/posts`, plus the series and topic catalogs)
- `posts/manifest.json`
- `public/images`
- `site.config.js`

Restore flow:

1. Copy the saved files back into the repo.
2. Run `pnpm sync:posts`.
3. Run `pnpm build`.
4. Deploy a new artifact.
