param(
  [ValidateSet('windows','linux')] [string] $os = 'windows',
  [ValidateSet('amd64','arm64')]   [string] $arch = 'amd64',
  [string]                         $version = 'v0.1.0'
)

$ErrorActionPreference = 'Stop'

Write-Host "==> Building UI"
Push-Location web
npm run build
Pop-Location

$commit  = (git rev-parse --short HEAD) 2>$null
if (-not $commit) { $commit = 'nogit' }
# Cross-version safe UTC timestamp
$builtAt = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")

$ext = $(if ($os -eq 'windows') { '.exe' } else { '' })
$out = "bin/alertd$ext"

Write-Host "==> Building Go ($os/$arch) -> $out"
$env:GOOS = $os
$env:GOARCH = $arch
$env:CGO_ENABLED = '0'

go build -trimpath `
  -ldflags "-s -w `
    -X github.com/ashrafinamdar23/alertd/pkg/version.Version=$version `
    -X github.com/ashrafinamdar23/alertd/pkg/version.Commit=$commit `
    -X github.com/ashrafinamdar23/alertd/pkg/version.BuiltAt=$builtAt" `
  -o $out ./cmd/alertd

Write-Host "==> Done: $out ($os/$arch)"
