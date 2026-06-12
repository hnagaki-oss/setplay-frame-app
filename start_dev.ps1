param(
  [string]$HostName = "127.0.0.1",
  [int]$Port = 5173
)

$ErrorActionPreference = "Stop"

$npm = Join-Path $env:ProgramFiles "nodejs\npm.cmd"
if (-not (Test-Path -LiteralPath $npm)) {
  $npm = "npm.cmd"
}

& $npm run dev -- --host $HostName --port $Port
