# Scripts

Scripts are grouped by responsibility, not by file type.

Normal commands:

| Script | Run directly? | Purpose |
| --- | --- | --- |
| `vps/deploy.sh` | Yes | Build locally, upload the artifact, deploy to the VPS, restart systemd, and run the health check. This is exposed as `pnpm deploy:vps`. |
| `dev/setup.sh` | Yes | Prepare a local macOS/Linux development checkout. |
| `dev/setup.ps1` | Yes | Prepare a local Windows PowerShell development checkout. |

VPS deployment internals:

| Script | Run directly? | Purpose |
| --- | --- | --- |
| `vps/build-artifact.sh` | Rarely | Build the standalone Next.js artifact on a Linux machine. `vps/deploy.sh` calls this automatically. |
| `vps/provision.sh` | No | Remote orchestrator used by `vps/deploy.sh`; installs runtime packages when requested, installs the release, and configures Caddy when requested. |
| `vps/install-runtime.sh` | No | Install Node.js, pnpm, Caddy, and the `nextjs` service user on Ubuntu. |
| `vps/install-release.sh` | No | Install one prebuilt artifact under `/srv/nextjs/wangqiwen-me`, write systemd, restart the app, check health, and rollback on failure. |
| `vps/configure-caddy.sh` | No | Write and reload the Caddy reverse proxy config for the VPS site. |

Content maintenance:

| Script | Run directly? | Purpose |
| --- | --- | --- |
| `content/new-post.cjs` | Prefer `pnpm new:post` | Create a draft post and sync metadata. |
| `content/sync-posts.cjs` | Prefer `pnpm sync:posts` | Normalize post metadata and rebuild `posts/manifest.json`. |
| `content/lint-posts.cjs` | Prefer `pnpm lint:posts` | Validate post metadata. |
| `content/backup.cjs` | Prefer `pnpm backup:content` | Back up posts, images, manifest, site config, and links. |
| `content/reset.cjs` | Prefer `pnpm reset:content -- --force` | Reset content after taking a backup. |

Day-to-day deployment should use only:

```bash
pnpm deploy:vps
```

First server setup or Caddy changes should use:

```bash
SETUP_SERVER=1 pnpm deploy:vps
```
