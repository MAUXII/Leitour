# Leitour · Firebase setup (PowerShell)
# Espelho do scripts/setup-firebase.sh para Windows sem bash.

$ErrorActionPreference = "Stop"
$EnvFile = ".env.local"

function Write-Env([string]$Key, [string]$Value) {
  if (-not (Test-Path $EnvFile)) { New-Item -ItemType File -Path $EnvFile | Out-Null }
  $lines = Get-Content $EnvFile -ErrorAction SilentlyContinue | Where-Object { $_ -notmatch "^${Key}=" }
  $lines + "$Key=$Value" | Set-Content $EnvFile -Encoding utf8
  Write-Host "  wrote $Key -> $EnvFile" -ForegroundColor Green
}

function Ask([string]$Prompt) {
  $v = Read-Host "  $Prompt"
  return $v.Trim()
}

Write-Host ""
Write-Host "  Leitour · Firebase setup (5 stages)" -ForegroundColor Cyan
Write-Host "  Voce dirige o browser; este script grava .env.local" -ForegroundColor DarkGray
Write-Host ""
Read-Host "  Ready? Enter"

Write-Host "`n  Stage 1/5 · Criar projeto" -ForegroundColor Cyan
Start-Process "https://console.firebase.google.com/"
Write-Host "  • Login Google → Add project → nome leitour"
Read-Host "  Projeto aberto? Enter"

Write-Host "`n  Stage 2/5 · App Web + chaves" -ForegroundColor Cyan
Start-Process "https://console.firebase.google.com/"
Write-Host "  • Icone Web </> → leitour-web → copie firebaseConfig"
$apiKey = Ask "apiKey"
$authDomain = Ask "authDomain"
$projectId = Ask "projectId"
$storageBucket = Ask "storageBucket"
$messagingSenderId = Ask "messagingSenderId"
$appId = Ask "appId"
Write-Env "NEXT_PUBLIC_FIREBASE_API_KEY" $apiKey
Write-Env "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" $authDomain
Write-Env "NEXT_PUBLIC_FIREBASE_PROJECT_ID" $projectId
Write-Env "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" $storageBucket
Write-Env "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" $messagingSenderId
Write-Env "NEXT_PUBLIC_FIREBASE_APP_ID" $appId

Write-Host "`n  Stage 3/5 · Authentication Email/Password" -ForegroundColor Cyan
Start-Process "https://console.firebase.google.com/"
Write-Host "  • Build → Authentication → Email/Password → Enable"
Read-Host "  Ligado? Enter"

Write-Host "`n  Stage 4/5 · Firestore" -ForegroundColor Cyan
Start-Process "https://console.firebase.google.com/"
Write-Host "  • Build → Firestore → Create database (production)"
Write-Host "  • Regiao ex.: southamerica-east1"
Read-Host "  Criado? Enter"

Write-Host "`n  Stage 5/5 · Rules" -ForegroundColor Cyan
Start-Process "https://console.firebase.google.com/"
Write-Host "  • Firestore → Rules → cole firestore.rules do repo → Publish"
Read-Host "  Publicado? Enter"

Write-Host "`n  Setup complete. npm run dev → /auth/signup" -ForegroundColor Green
