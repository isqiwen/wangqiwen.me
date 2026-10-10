# Release safety and Node.js 24 migration

## Runtime baseline

Use Node.js 24 LTS locally, in CI, in the Linux build container and on the VPS.
`.nvmrc` selects the major line; package.json rejects unsupported major lines.
The dependency lockfile includes targeted security overrides, such as nanoid
3.3.18, fast-uri 3.1.8 and source-map-js 1.2.2; see the pnpm overrides in
package.json. The pinned Node type definitions remain a conservative API
surface, not the runtime version.

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

The supported major has one default, in install-runtime.sh. After installing,
that script fails unless /usr/bin/node reports the requested major, because apt
keeps a newer or pinned package without an error.

Every release is also checked before it replaces the running one: the artifact
records the Node.js version that built it, and install-release.sh refuses to
install it when /usr/bin/node has a different major. The current release keeps
running and the message names the migration command above. To release onto
another major on purpose, set `SKIP_NODE_VERSION_CHECK=1`. Confirm the
installed runtime at any time with:

```bash
ssh <deploy-user>@wangqiwen.me /usr/bin/node -v
```

## Local authoring boundary

`pnpm dev` binds to 127.0.0.1. Use http://127.0.0.1:3000 in the browser.
For remote development, use a loopback-only SSH forward:

```bash
ssh -N -L 127.0.0.1:3000:127.0.0.1:3000 your-development-host
```

The editor checks the Host header, rejects cross-site requests, and requires a
matching Origin for state-changing requests. Forwarded headers never authorize
access. Production editor pages and APIs remain unavailable.

In production the editor is closed three times over: the middleware answers
404 for `/editor` and `/api/editor`, the editor layout calls `notFound()`, and
every editor API handler refuses to run. Draft and archived articles are not
part of the build, and the article route has no path for them.

These header checks are not authentication. Do not publish the development
server through FRP, a reverse proxy, a public tunnel or an all-interface bind.
A service intentionally exposed to other users needs actual authentication.
A trusted local API client must set its matching Origin when mutating content.

## Artifact boundary

The runtime is assembled from server.js, package.json, node_modules and .next
inside the standalone output, plus compiled static assets, public assets and a
published-only posts/manifest.json. The manifest is also compiled into the
server, which is what requests read; the copied file is a record of what the
artifact contains. The repository is not copied wholesale.
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

Advisories are also published while the repository is quiet. The
`Dependency audit` workflow runs the same audit every day and fails when a
high or critical advisory affects a production dependency. Dependabot opens weekly pull requests for npm packages and GitHub Actions.
Minor and patch updates are grouped; next, @next/mdx and eslint-config-next move
together; Next.js majors are ignored because a major is a migration. pnpm
overrides are not updated by Dependabot, so a vulnerable override is reported by
the daily audit instead.

## Response headers

next.config.js sends these headers with every response, including static files,
APIs and blocked editor routes:

| Header                    | Value                                                                            |
| ------------------------- | -------------------------------------------------------------------------------- |
| Strict-Transport-Security | `max-age=31536000`                                                               |
| X-Content-Type-Options    | `nosniff`                                                                        |
| X-Frame-Options           | `SAMEORIGIN`                                                                     |
| Referrer-Policy           | `strict-origin-when-cross-origin`                                                |
| Permissions-Policy        | `camera=(), microphone=(), geolocation=()`                                       |
| Content-Security-Policy   | `base-uri 'self'; form-action 'self'; frame-ancestors 'self'; object-src 'none'` |

HSTS omits includeSubDomains because other hosts on this domain are served
outside this application. The content security policy has no script or style
allowlist: pages are prerendered and use inline scripts, so a nonce-based policy
would force dynamic rendering. It therefore does not mitigate script injection.
The packaged-runtime smoke tests assert these headers.

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
