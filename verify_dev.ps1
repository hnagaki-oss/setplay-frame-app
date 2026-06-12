$ErrorActionPreference = "Stop"

$npm = Join-Path $env:ProgramFiles "nodejs\npm.cmd"
if (-not (Test-Path -LiteralPath $npm)) {
  $npm = "npm.cmd"
}

& $npm run check
& $npm run build

try {
  $response = Invoke-WebRequest "http://127.0.0.1:5173/" -UseBasicParsing -TimeoutSec 5
  if ($response.StatusCode -ne 200) {
    throw "Unexpected HTTP status: $($response.StatusCode)"
  }
  Write-Host "Dev server HTTP check: 200 OK"

  $package = Get-Content -Raw -Encoding UTF8 -Path "package.json" | ConvertFrom-Json
  $statusResponse = Invoke-WebRequest "http://127.0.0.1:5173/api/status" -UseBasicParsing -TimeoutSec 5
  $status = $statusResponse.Content | ConvertFrom-Json
  if ($status.appVersion -ne $package.version) {
    throw "Unexpected appVersion: $($status.appVersion) (expected $($package.version))"
  }
  Write-Host "Dev server status check: appVersion $($status.appVersion)"
} catch {
  Write-Warning "Dev server is not responding on http://127.0.0.1:5173/. Start it with .\start_dev.ps1"
}
