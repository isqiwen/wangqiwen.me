# Wang Qiwen Blog

Personal publishing site built with Next.js, MDX, Tailwind CSS, SWR, and Upstash Redis.

## Development Setup

Install Node.js 24 LTS (see `.nvmrc`), then run the setup script for your platform:

macOS/Linux:

```bash
bash scripts/dev/setup.sh
```

Windows PowerShell:

```powershell
pwsh ./scripts/dev/setup.ps1
```

Start the site:

```bash
pnpm dev
```

Open <http://127.0.0.1:3000>. The editor is local-only; use an SSH forward for remote development, not a publicly exposed development server.

No local environment file is needed by default. Create one only when using real external services:

```bash
cp .env.example .env.local
```

## Write a Post

```bash
pnpm new:post --id my-first-post --title "My First Post" --description "A short summary of the post."
```

Then write and publish it locally at `/editor`. See the [Editor guide](docs/editor.md) for the complete workflow.

## Check Before Releasing

```bash
pnpm check
pnpm test
pnpm build
```

The complete release gate also requires browser tests, a dependency audit and packaged-runtime smoke tests. See [Release safety](docs/release-safety.md) for the checks, local smoke-test workflow and Node.js 24 migration procedure.

## Deploy

Before the first deployment:

1. Customize your site identity in `site.config.js`.
2. Replace the bundled posts and images with your own content; see [Write a Post](#write-a-post). To start with an empty site (a backup is created first):

   ```bash
   pnpm reset:content -- --force
   ```

3. Set your server configuration in `deploy.env`.
4. Create the production env file:

   ```bash
   cp .env.example .env.production
   ```

5. Fill `.env.production` with the production values, then deploy. Run this
   directly on macOS/Linux, or from a WSL2 terminal opened in this repository on Windows:

   ```bash
   UPLOAD_ENV=1 SETUP_SERVER=1 pnpm deploy:vps
   ```

After the first deployment, use this for code or content changes. On Windows,
run it from the same WSL2 terminal:

```bash
pnpm deploy:vps
```

Existing Node.js 20 servers need the one-time runtime migration described in [Release safety](docs/release-safety.md) before deploying the new baseline.

## Guides

- [Initialization and customization](docs/customization.md)
- [Editor guide](docs/editor.md)
- [VPS deployment](docs/deployment.md)
- [Operations runbook](docs/operations.md)
- [Release safety and runtime migration](docs/release-safety.md)
- [Script reference](scripts/README.md)
