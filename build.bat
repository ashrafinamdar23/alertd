@echo off
REM Usage: build.bat [windows|linux] [amd64|arm64] [version]
setlocal enabledelayedexpansion

set OS=%1
if "%OS%"=="" for /f "usebackq delims=" %%A in (`go env GOOS`) do set OS=%%A

set ARCH=%2
if "%ARCH%"=="" set ARCH=amd64

set VERSION=%3
if "%VERSION%"=="" set VERSION=v0.1.0

echo ==> Building UI (Vite)
pushd web
call npm run build || goto :error
popd

for /f "usebackq delims=" %%A in (`git rev-parse --short HEAD 2^>NUL`) do set COMMIT=%%A
if "%COMMIT%"=="" set COMMIT=nogit

REM Cross-version safe UTC timestamp via PowerShell
for /f "usebackq delims=" %%A in (`
  powershell -NoProfile -Command "[DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')"
`) do set BUILT_AT=%%A

if /I "%OS%"=="windows" (set EXT=.exe) else (set EXT=)
set OUT=bin\alertd%EXT%

echo ==> Building Go %OS%/%ARCH% -> %OUT%
set GOOS=%OS%
set GOARCH=%ARCH%
set CGO_ENABLED=0

go build -trimpath -ldflags "-s -w -X github.com/ashrafinamdar23/alertd/pkg/version.Version=%VERSION% -X github.com/ashrafinamdar23/alertd/pkg/version.Commit=%COMMIT% -X github.com/ashrafinamdar23/alertd/pkg/version.BuiltAt=%BUILT_AT%" -o %OUT% ./cmd/alertd || goto :error

echo ==> Done: %OUT% (%OS%/%ARCH%)
exit /b 0

:error
echo Build failed.
exit /b 1
