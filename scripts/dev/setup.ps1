#!/usr/bin/env pwsh
# Development setup for Windows (PowerShell)
# - Ensures corepack/pnpm is available
# - Installs dependencies
# - Leaves .env.local optional
# - Synchronizes post metadata so the local manifest is ready

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $Root

if (-not $env:COREPACK_NPM_REGISTRY) {
  $env:COREPACK_NPM_REGISTRY = "https://registry.npmmirror.com"
}
$env:COREPACK_NPM_REGISTRY = $env:COREPACK_NPM_REGISTRY.TrimEnd([char]"/")

Write-Host "==> Ensuring corepack is enabled (pnpm)"
if (-not (Get-Command corepack -ErrorAction SilentlyContinue)) {
  Write-Error "corepack not found. Install Node.js 24 LTS and Corepack, then rerun."
}
if (([version](node -p "process.versions.node")).Major -ne 24) {
  Write-Error "Node.js 24 LTS is required."
}
corepack enable | Out-Null
if ($LASTEXITCODE -ne 0) { throw "corepack enable failed." }

Write-Host "==> Installing dependencies via pnpm"
pnpm install --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw "Dependency installation failed." }

Write-Host "==> Synchronizing post metadata"
pnpm sync:posts -- --silent
if ($LASTEXITCODE -ne 0) { throw "Post metadata synchronization failed." }

Write-Host "==> Done. Next steps:"
Write-Host "    1. Run: pnpm dev"
Write-Host "    2. Open: http://127.0.0.1:3000"
Write-Host "    3. Create .env.local only if you need real external services locally"
