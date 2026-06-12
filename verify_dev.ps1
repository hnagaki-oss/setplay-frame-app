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
} catch {
  Write-Warning "Dev server is not responding on http://127.0.0.1:5173/. Start it with .\start_dev.ps1"
}
