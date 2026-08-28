# Scripts

Scripts are grouped by responsibility, not by file type.

Normal commands:

| Script          | Run directly? | Purpose                                                                                                                                                    |
| --------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vps/deploy.sh` | Yes           | Read `deploy.env`, build locally, upload the artifact, deploy to the VPS, restart systemd, and run the health check. This is exposed as `pnpm deploy:vps`. |
| `dev/setup.sh`  | Yes           | Prepare a local macOS/Linux development checkout.                                                                                                          |
| `dev/setup.ps1` | Yes           | Prepare a local Windows PowerShell development checkout.                                                                                                   |

VPS deployment internals:

| Script                   | Run directly? | Purpose                                                                                                                                           |
| ------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vps/build-artifact.sh`  | Rarely        | Build the standalone Next.js artifact in an isolated temporary workspace. It bundles only published articles; `vps/deploy.sh` calls it automatically. |
| `vps/provision.sh`       | No            | Remote orchestrator used by `vps/deploy.sh`; installs runtime packages when requested, installs the release, and safely configures this app's Caddy hosts when requested. |
| `vps/install-runtime.sh` | No            | Install Node.js, pnpm, and the `nextjs` service user on Ubuntu; installs Caddy if it is absent and otherwise leaves it unchanged.              |
| `vps/install-release.sh` | No            | Install one prebuilt artifact under the configured service directory, write systemd, restart the app, check health, and rollback on failure.      |
| `vps/configure-caddy.sh` | No            | Add missing app Caddy blocks or replace a confirmed conflicting standalone block; it never removes unrelated sites or snippets.                    |

Content maintenance:

| Script                   | Run directly?                          | Purpose                                                             |
| ------------------------ | -------------------------------------- | ------------------------------------------------------------------- |
| `content/new-post.cjs`   | Prefer `pnpm new:post`                 | Create a draft post and sync metadata.                              |
| `content/sync-posts.cjs` | Prefer `pnpm sync:posts`               | Normalize post metadata and rebuild `posts/manifest.json`.          |
| `content/lint-posts.cjs` | Prefer `pnpm lint:posts`               | Validate post metadata.                                             |
| `content/backup.cjs`     | Prefer `pnpm backup:content`           | Back up posts, images, manifest, content catalogs, and site config. |
| `content/reset.cjs`      | Prefer `pnpm reset:content -- --force` | Reset content after taking a backup.                                |

Day-to-day deployment should use only:

```bash
pnpm deploy:vps
```

Non-secret target settings such as the SSH host, app name, domain, service user, and port live in the repository root [`deploy.env`](../deploy.env). Command environment variables override that file for a single deployment.

First server setup with env upload should use:

```bash
UPLOAD_ENV=1 SETUP_SERVER=1 pnpm deploy:vps
```

`SETUP_SERVER=1` installs and configures the VPS runtime environment. It leaves an already-correct Caddy site untouched, appends only missing `wangqiwen.me` / `www.wangqiwen.me` blocks, and asks before replacing a conflicting block. Normal later releases should use only `pnpm deploy:vps`.
