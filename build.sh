#!/usr/bin/env bash
# Usage:
#   ./build.sh [linux|windows] [amd64|arm64] [version]
# Examples:
#   ./build.sh                 # builds for your host (default arch=amd64, version=v0.1.0)
#   ./build.sh linux arm64 v0.1.1
#   ./build.sh windows amd64

set -euo pipefail

OS="${1:-$(go env GOOS)}"
ARCH="${2:-amd64}"
VERSION="${3:-v0.1.0}"

echo "==> Building UI (Vite)"
pushd web >/dev/null
npm run build
popd >/dev/null

COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo nogit)"
BUILT_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

EXT=""
[[ "$OS" == "windows" ]] && EXT=".exe"
OUT="bin/alertd${EXT}"

echo "==> Building Go ($OS/$ARCH) -> $OUT"
GOOS="$OS" GOARCH="$ARCH" CGO_ENABLED=0 \
go build -trimpath \
  -ldflags "-s -w \
    -X github.com/ashrafinamdar23/alertd/pkg/version.Version=$VERSION \
    -X github.com/ashrafinamdar23/alertd/pkg/version.Commit=$COMMIT \
    -X github.com/ashrafinamdar23/alertd/pkg/version.BuiltAt=$BUILT_AT" \
  -o "$OUT" ./cmd/alertd

echo "==> Done: $OUT ($OS/$ARCH)"
