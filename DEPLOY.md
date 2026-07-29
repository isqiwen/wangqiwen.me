# VPS Deployment

The recommended VPS path is intentionally one-directional:

```text
local/CI Linux build -> tarball upload -> systemd restart -> Caddy proxy
```

Do not run `next build` on the small VPS. Build the standalone artifact before it reaches the server.

## Normal Release

From the repo root:

```bash
pnpm deploy:vps
```

That command uses these defaults:

| Setting | Default |
| --- | --- |
| SSH target | `qiwen@wangqiwen.me` |
| Domain | `wangqiwen.me` |
| Alias | `www.wangqiwen.me` |
| App name | `wangqiwen-me` |
| Service user | `nextjs` |
| App directory | `/srv/nextjs/wangqiwen-me` |
| App listener | `127.0.0.1:3000` |
| Production env source | VPS `.env.local`; upload `.env.production` only with `UPLOAD_ENV=1` |

Override only what changes:

```bash
DEPLOY_HOST=qiwen@1.2.3.4 pnpm deploy:vps
```

The SSH user must have passwordless sudo because the remote install writes `/srv`, systemd, and Caddy config:

```bash
ssh qiwen@wangqiwen.me 'sudo -n true'
```

If that fails, add a sudoers rule on the VPS:

```bash
sudo visudo -f /etc/sudoers.d/wangqiwen-deploy
```

```text
qiwen ALL=(root) NOPASSWD: ALL
```

The deploy script reuses one SSH connection by default. With SSH password auth, a single deploy should normally ask for the SSH password once. SSH keys are still the preferred long-term setup.

## Production Env

The app reads production secrets from the VPS:

```text
/srv/nextjs/wangqiwen-me/.env.local
```

For normal code-only releases, the deploy command keeps the existing VPS env file:

```bash
pnpm deploy:vps
```

For first setup or env changes, create `.env.production` locally and upload it explicitly:

```bash
UPLOAD_ENV=1 pnpm deploy:vps
```

The release installer preserves `.env`, `.env.production`, and `.env.local` when swapping app directories, so `/srv/nextjs/wangqiwen-me/.env.local` does not need to be recreated on every deploy.

## First-Time VPS Setup

Create the production env file locally:

```bash
cp .env.example .env.production
```

Fill at least:

```text
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
EDITOR_ACCESS_TOKEN=
```

Then run:

```bash
UPLOAD_ENV=1 SETUP_SERVER=1 pnpm deploy:vps
```

`SETUP_SERVER=1` installs Node.js, pnpm, Caddy, creates the `nextjs` user, deploys the app, and writes the Caddy site config. For later releases, leave it unset.

## What The Deploy Command Does

`pnpm deploy:vps` runs [scripts/vps/deploy.sh](scripts/vps/deploy.sh):

- requires a clean Git working tree by default
- checks that the SSH user has passwordless sudo before build/upload
- builds a standalone tarball with [scripts/vps/build-artifact.sh](scripts/vps/build-artifact.sh)
- uploads the tarball to `/tmp`
- keeps the existing VPS `.env.local` by default
- uploads `.env.production` as `/tmp/prod.env` only when `UPLOAD_ENV=1`
- uploads the current deploy scripts to `/tmp`
- runs [scripts/vps/provision.sh](scripts/vps/provision.sh) on the VPS
- restarts `wangqiwen-me.service`
- checks `http://127.0.0.1:3000/api/health`

If the new release fails to start or fails health check, [scripts/vps/install-release.sh](scripts/vps/install-release.sh) restores the previous release automatically.

## Dependency Changes

Yes, dependency changes are handled by repeated `pnpm deploy:vps` runs as long as `package.json` and `pnpm-lock.yaml` are committed together.

The deploy command:

- runs `pnpm install --frozen-lockfile` locally before building
- fails before upload if the lockfile is stale
- builds a fresh standalone artifact for every run
- deploys the artifact to a temporary stage directory on the VPS
- swaps the new release into `/srv/nextjs/wangqiwen-me`
- keeps the previous release for automatic rollback
- cleans temporary upload files after the command exits

The VPS does not run `pnpm install` during a normal release. It only runs the finished standalone artifact, so dependency changes must succeed during the local Linux build.

For native dependencies, the build machine should match the VPS operating system and CPU architecture. The script requires Linux by default and checks the VPS architecture before building.

## Verification

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

## Notes

- Runtime secrets live on the VPS at `/srv/nextjs/wangqiwen-me/.env.local`.
- The app listens only on `127.0.0.1:3000`; public traffic goes through Caddy on ports `80` and `443`.
- Production `/editor` changes are written inside `/srv/nextjs/wangqiwen-me`; sync them back to Git before the next artifact deploy if they must be kept.
- Operational details and recovery commands are in [OPERATIONS.md](OPERATIONS.md).
