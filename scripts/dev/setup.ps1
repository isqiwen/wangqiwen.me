#!/usr/bin/env pwsh
# Development setup for Windows (PowerShell)
# - Ensures corepack/pnpm is available
# - Installs dependencies
# - Leaves .env.local optional
# - Synchronizes post metadata so the local manifest is ready

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $Root

# Corepack obtains pnpm before pnpm can read the project's .npmrc.
if (-not $env:COREPACK_NPM_REGISTRY) {
  $env:COREPACK_NPM_REGISTRY = "https://registry.npmmirror.com"
}
$env:COREPACK_NPM_REGISTRY = $env:COREPACK_NPM_REGISTRY.TrimEnd([char]"/")

Write-Host "==> Ensuring corepack is enabled (pnpm)"
if (-not (Get-Command corepack -ErrorAction SilentlyContinue)) {
  Write-Error "corepack not found. Install Node.js 20.9+ (includes corepack) and rerun."
}
if ([version](node -p "process.versions.node") -lt [version]"20.9.0") {
  Write-Error "Node.js 20.9 or newer is required."
}
corepack enable | Out-Null

Write-Host "==> Installing dependencies via pnpm"
pnpm install

Write-Host "==> Synchronizing post metadata"
pnpm sync:posts -- --silent

Write-Host "==> Done. Next steps:"
Write-Host "    1. Run: pnpm dev"
Write-Host "    2. Open: http://localhost:3000"
Write-Host "    3. Create .env.local only if you need real external services locally"
