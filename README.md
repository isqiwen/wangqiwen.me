# Wang Qiwen Blog

Personal publishing site built with Next.js, MDX, Tailwind CSS, SWR, and Upstash Redis.

## Development Setup

Install Node.js 20.9+, then run the setup script for your platform:

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

Open <http://localhost:3000>.

No local environment file is needed by default. Create one only when using real external services:

```bash
cp .env.example .env.local
```

## Write a Post

```bash
pnpm new:post --id my-first-post
```

Then write and publish it locally at `/editor`. See the [Editor guide](docs/editor.md) for the complete workflow.

## Check Before Releasing

```bash
pnpm check
pnpm build
```

## Deploy

Before the first deployment, update `deploy.env` for your server and fill the production values in `.env.production`:

```bash
cp .env.example .env.production
UPLOAD_ENV=1 SETUP_SERVER=1 pnpm deploy:vps
```

After the first deployment, use this for code or content changes:

```bash
pnpm deploy:vps
```

## Guides

- [Initialization and customization](docs/customization.md)
- [Editor guide](docs/editor.md)
- [VPS deployment](docs/deployment.md)
- [Operations runbook](docs/operations.md)
- [Script reference](scripts/README.md)
