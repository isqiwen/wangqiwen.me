#!/usr/bin/env pwsh
# Cross-platform dev setup for Windows (PowerShell)
# - Ensures corepack/pnpm is available
# - Installs dependencies
# - Copies .env.example if missing

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

Write-Host "==> Done. Next steps:"
Write-Host "    pnpm dev --filter blog   # start dev server"
