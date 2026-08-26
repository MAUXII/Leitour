# Leitour · Cloudinary setup (PowerShell)
# Depois de criar a conta: cola cloud name + API key + API secret no .env.local

$ErrorActionPreference = "Stop"
$EnvFile = ".env.local"

function Write-Env([string]$Key, [string]$Value) {
  if (-not (Test-Path $EnvFile)) { New-Item -ItemType File -Path $EnvFile | Out-Null }
  $lines = @(Get-Content $EnvFile -ErrorAction SilentlyContinue | Where-Object { $_ -notmatch "^${Key}=" })
  $lines + "$Key=$Value" | Set-Content $EnvFile -Encoding utf8
  Write-Host "  wrote $Key -> $EnvFile" -ForegroundColor Green
}

function Ask([string]$Prompt) {
  return (Read-Host "  $Prompt").Trim()
}

function Ask-Secret([string]$Prompt) {
  $secure = Read-Host "  $Prompt" -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr).Trim()
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}

Write-Host ""
Write-Host "  Leitour · Cloudinary (3 stages)" -ForegroundColor Cyan
Write-Host "  Conta ja criada? Vamos pegar as chaves da API." -ForegroundColor DarkGray
Write-Host ""
Read-Host "  Enter para comecar"

Write-Host "`n  Stage 1/3 · Abrir Dashboard" -ForegroundColor Cyan
Start-Process "https://console.cloudinary.com/console"
Write-Host "  • Login na conta que voce criou"
Write-Host "  • No overview, ache Cloud name / API Key / API Secret"
Read-Host "  Dashboard aberto? Enter"

Write-Host "`n  Stage 2/3 · Colar chaves" -ForegroundColor Cyan
$cloud = Ask "Cloud name"
$key = Ask "API Key"
$secret = Ask-Secret "API Secret (oculto)"
if (-not $cloud -or -not $key -or -not $secret) {
  throw "Faltou cloud name, API key ou secret."
}
Write-Env "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME" $cloud
Write-Env "CLOUDINARY_API_KEY" $key
Write-Env "CLOUDINARY_API_SECRET" $secret

Write-Host "`n  Stage 3/3 · Reiniciar o Next" -ForegroundColor Cyan
Write-Host "  Pare o npm run dev (Ctrl+C) e rode de novo para carregar o .env.local"
Read-Host "  Enter para terminar"

Write-Host "`n  Pronto. Onboarding -> escolher foto -> Continuar." -ForegroundColor Green
Write-Host "  URL fica no Cloudinary e no photoURL (Auth + Firestore)." -ForegroundColor DarkGray
