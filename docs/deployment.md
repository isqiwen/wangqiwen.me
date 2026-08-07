# VPS Deployment

The recommended VPS path is intentionally one-directional:

```text
local/CI Linux build -> tarball upload -> systemd restart -> Caddy proxy
```

Do not run `next build` on the small VPS. Build the standalone artifact before it reaches the server.

On macOS and other non-Linux hosts, `pnpm deploy:vps` builds that Linux artifact
in Docker for the VPS CPU architecture automatically. Docker must be installed
and running; local `node_modules`, `.next`, and the pnpm store are kept out of
the container so the Linux build does not replace your development dependencies
or create a large local cache.

## Normal Release

From the repo root:

```bash
pnpm deploy:vps
```

That command reads the tracked, non-secret deployment defaults from
[`deploy.env`](../deploy.env):

| Setting               | Config value                                                        |
| --------------------- | ------------------------------------------------------------------- |
| SSH target            | `qiwen@wangqiwen.me`                                                |
| Domain                | `wangqiwen.me`                                                      |
| Alias                 | `www.wangqiwen.me`                                                  |
| App name              | `wangqiwen-me`                                                      |
| Service user          | `nextjs`                                                            |
| App directory         | `/srv/nextjs/wangqiwen-me`                                          |
| App listener          | `127.0.0.1:3000`                                                    |
| Production env source | VPS `.env.local`; upload `.env.production` only with `UPLOAD_ENV=1` |

Edit `deploy.env` when the deployment target changes. Command environment variables take precedence for one-off overrides:

```bash
DEPLOY_HOST=qiwen@1.2.3.4 pnpm deploy:vps
```

`DEPLOY_HOST` is also how the script discovers the VPS architecture: before
building, it connects over SSH and runs `uname -m`. It maps `x86_64` to
`linux/amd64` and `arm64`/`aarch64` to `linux/arm64` for the Docker build. Do
not add a CPU architecture setting to `deploy.env`; checking the live VPS keeps
the build target from becoming stale.

Use `DEPLOY_CONFIG` to read a different config file:

```bash
DEPLOY_CONFIG=deploy.staging.env pnpm deploy:vps
```

`deploy.env` contains no secrets and is committed to Git. Do not put SSH passwords, private keys, sudo passwords, application tokens, or production environment variables in it.

The SSH user must have passwordless sudo because the remote install writes `/srv`, systemd, and Caddy config:

```bash
ssh qiwen@wangqiwen.me 'sudo -n true'
```

If that fails, add a sudoers rule on the VPS:

```bash
sudo visudo -f /etc/sudoers.d/wangqiwen-me-deploy
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

For first setup, create the local production env file:

```bash
cp .env.example .env.production
```

Fill or update `.env.production`, then upload it explicitly:

```bash
UPLOAD_ENV=1 pnpm deploy:vps
```

By default, `UPLOAD_ENV=1` uploads `.env.production` and installs it on the VPS as `/srv/nextjs/wangqiwen-me/.env.local`. If the local file does not exist, deployment stops before uploading and prints the creation command. To use a different local env file, set `ENV_FILE` explicitly:

```bash
UPLOAD_ENV=1 ENV_FILE=.env.staging pnpm deploy:vps
```

Do not commit `.env.production` or other production env files; they should stay local.

The release installer preserves `.env`, `.env.production`, and `.env.local` when swapping app directories, so `/srv/nextjs/wangqiwen-me/.env.local` does not need to be recreated on every deploy.

## First-Time VPS Runtime Setup

Create the production env file locally:

```bash
cp .env.example .env.production
```

This file contains production secrets and must not be committed.

Fill at least:

```text
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Then run:

```bash
UPLOAD_ENV=1 SETUP_SERVER=1 pnpm deploy:vps
```

`SETUP_SERVER=1` changes the VPS runtime environment. It installs Node.js, pnpm, Caddy, creates the `nextjs` service user, prepares `/srv/nextjs`, deploys the app, and writes the Caddy site config.

For normal later releases, leave `SETUP_SERVER` unset:

```bash
pnpm deploy:vps
```

## What The Deploy Command Does

`pnpm deploy:vps` runs [scripts/vps/deploy.sh](../scripts/vps/deploy.sh):

- reads non-secret deployment settings from `deploy.env`
- requires a clean Git working tree by default
- runs `pnpm install --frozen-lockfile`, `pnpm test`, and `pnpm check` locally before opening an SSH connection
- checks that the SSH user has passwordless sudo before build/upload
- builds a standalone tarball with [scripts/vps/build-artifact.sh](../scripts/vps/build-artifact.sh)
- uploads the tarball to `/tmp`
- keeps the existing VPS `.env.local` by default
- uploads `.env.production` as `/tmp/prod.env` only when `UPLOAD_ENV=1`
- uploads the current deploy scripts to `/tmp`
- runs [scripts/vps/provision.sh](../scripts/vps/provision.sh) on the VPS
- restarts `wangqiwen-me.service`
- checks `http://127.0.0.1:3000/api/health`

If the local test suite or project checks fail, the command exits before connecting to, building for, or uploading to the VPS. External link health reporting remains a separate weekly workflow and does not block deployments.

If the new release fails to start or fails health check, [scripts/vps/install-release.sh](../scripts/vps/install-release.sh) restores the previous release automatically.

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

The VPS does not run `pnpm install` during a normal release. It only runs the finished standalone artifact, so dependency changes must succeed during the Linux build.

For native dependencies, the build environment must match the VPS operating
system and CPU architecture. The script checks the VPS architecture before
building; from macOS it uses Docker with the matching Linux platform
automatically. To build somewhere without Docker, use a Linux machine with the
same CPU architecture as the VPS.

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
- Production `/editor` and `/api/editor/*` return `404`; author and validate content locally, commit it, then deploy the artifact.
- Operational details and recovery commands are in [operations.md](operations.md).
