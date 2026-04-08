#!/usr/bin/env pwsh
# Development setup for Windows (PowerShell)
# - Ensures corepack/pnpm is available
# - Installs dependencies
# - Copies .env.example if missing
# - Synchronizes post metadata so the local manifest is ready

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "==> Ensuring corepack is enabled (pnpm)"
if (-not (Get-Command corepack -ErrorAction SilentlyContinue)) {
  Write-Error "corepack not found. Install Node.js 18+ (includes corepack) and rerun."
}
corepack enable | Out-Null

Write-Host "==> Installing dependencies via pnpm"
pnpm install

Write-Host "==> Preparing env file"
if (Test-Path ".env.example" -and -not (Test-Path ".env.local")) {
    Copy-Item ".env.example" ".env.local"
    Write-Host "Created .env.local from .env.example"
}

Write-Host "==> Synchronizing post metadata"
pnpm sync:posts -- --silent

Write-Host "==> Done. Next steps:"
Write-Host "    1. Update .env.local if needed"
Write-Host "    2. Run: pnpm dev"
Write-Host "    3. Open: http://localhost:3000"
