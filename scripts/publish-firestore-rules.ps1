# Publica firestore.rules no projeto Firebase (Leitour).
# Requer: npm i -g firebase-tools  OU  npx firebase-tools
# Login: npx firebase login

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "Deploy Firestore rules → projeto default (.firebaserc)…" -ForegroundColor Cyan
npx --yes firebase-tools@latest deploy --only firestore:rules

if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "CLI falhou. Fallback manual:" -ForegroundColor Yellow
  Write-Host "1. Abra https://console.firebase.google.com/project/leitour-a5097/firestore/rules"
  Write-Host "2. Cole o conteúdo de firestore.rules"
  Write-Host "3. Publish"
  exit $LASTEXITCODE
}

Write-Host "Rules publicadas." -ForegroundColor Green
Write-Host "Smoke: login → /books → obra → Escrever review → /feed"
