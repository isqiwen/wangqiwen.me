# Release safety and Node.js 24 migration

## Runtime baseline

Use Node.js 24 LTS locally, in CI, in the Linux build container and on the VPS.
`.nvmrc` selects the major line; package.json rejects unsupported major lines.
The existing dependency lockfile is unchanged. The pinned Node type definitions
remain a conservative API surface and are not the deployed runtime version.

With nvm, run `nvm install` and `nvm use` from the repository root, then run
`bash scripts/dev/setup.sh`. Windows uses `pwsh ./scripts/dev/setup.ps1`.

The repository's deploy.env defaults Docker builds to node:24-bookworm-slim.
A custom DEPLOY_CONFIG must also set a Node.js 24 Docker image; an explicitly
supplied DOCKER_IMAGE remains supported.

On an existing VPS, ordinary code deployment does not upgrade the installed
runtime. Check other applications that share /usr/bin/node before an upgrade.
After reviewing that change, the one-time deployment command is:

```bash
RUN_INSTALL=1 INSTALL_CADDY=0 RUN_SITE_CONFIG=0 pnpm deploy:vps
```

This upgrades the runtime using install-runtime.sh and deploys the site. It keeps
Caddy configuration and the existing production environment file unchanged.
It is an operator action, not something CI performs. Subsequent deployments use
`pnpm deploy:vps` normally.

## Local authoring boundary

`pnpm dev` binds to 127.0.0.1. Use http://127.0.0.1:3000 in the browser.
For remote development, use a loopback-only SSH forward:

```bash
ssh -N -L 127.0.0.1:3000:127.0.0.1:3000 your-development-host
```

The editor checks the Host header, rejects cross-site requests, and requires a
matching Origin for state-changing requests. Forwarded headers never authorize
access. Production editor pages and APIs remain unavailable.

These header checks are not authentication. Do not publish the development
server through FRP, a reverse proxy, a public tunnel or an all-interface bind.
A service intentionally exposed to other users needs actual authentication.
A trusted local API client must set its matching Origin when mutating content.

## Artifact boundary

The runtime is assembled from server.js, package.json, node_modules and .next
inside the standalone output, plus compiled static assets, public assets and a
published-only posts/manifest.json. The repository is not copied wholesale.
Backups, private .env files, test output and source article directories do not
belong in the runtime. Symlinks must resolve inside the finished artifact.

Everything deliberately placed in public/ is still a public asset, including
images used by drafts. Never place confidential media in that directory.
Excluding local environment files from the build workspace does not sanitize
secrets deliberately embedded in application source or passed to the build.

This pass does not make every local build a reproducible Git snapshot. The
existing working-tree source workflow and ALLOW_DIRTY option remain; do not
interpret a revision label as an attestation of byte-identical build inputs.

## Required validation

CI runs source/content checks, unit tests, Bats deployment tests, browser tests,
production dependency audit, build and packaged-runtime smoke tests. The jobs
are independent so a browser failure does not prevent an audit or a build.
`release-gate` fails unless every required job succeeds. Configure that check as
a required branch-protection check separately; this PR does not change repository
administration or automatically merge/deploy anything.

The audit uses the official npm registry explicitly because the configured
installation mirror may not implement npm's security-audit endpoint. Installing
dependencies can continue using the mirror.

Production CI creates actual draft and archived fixture files before compiling,
then verifies their routes, sharing images and public indexes do not expose them.
It also checks that the production editor is unavailable and compiled assets can
be fetched. Browser reports, traces, screenshots and video are retained by CI.

To smoke-test an assembled build locally after `pnpm build`:

```bash
bundle="$(mktemp -d)"
pnpm sync:posts -- --published-only --silent
node scripts/vps/assemble-artifact.cjs . "$bundle"
pnpm sync:posts -- --silent
SMOKE_APP_DIR="$bundle" pnpm test:smoke
```

The destination must be empty. Restore normal metadata with `pnpm sync:posts`
if the assembly command fails. The temporary bundle may be deleted after testing.
