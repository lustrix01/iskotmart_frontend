$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$baseUrl = if ($env:E2E_BASE_URL) { $env:E2E_BASE_URL } else { "http://localhost:5173" }
$reuseServer = $env:E2E_REUSE_SERVER -eq "1"
$serverProcess = $null

function Import-LocalEnv {
    param([string] $Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        return
    }

    Get-Content -LiteralPath $Path | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq "" -or $line.StartsWith("#") -or -not $line.Contains("=")) {
            return
        }

        $name, $value = $line.Split("=", 2)
        $name = $name.Trim()
        $value = $value.Trim().Trim('"').Trim("'")
        if ($name -match "^[A-Za-z_][A-Za-z0-9_]*$" -and -not [Environment]::GetEnvironmentVariable($name, "Process")) {
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

function Test-AppReady {
    param([string] $Url)

    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
        return [int] $response.StatusCode -ge 200 -and [int] $response.StatusCode -lt 500
    }
    catch {
        return $false
    }
}

function Stop-ProcessTree {
    param([int] $ProcessId)

    $children = Get-CimInstance Win32_Process -Filter "ParentProcessId = $ProcessId" -ErrorAction SilentlyContinue
    foreach ($child in $children) {
        Stop-ProcessTree -ProcessId ([int] $child.ProcessId)
    }

    $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
    if ($process) {
        Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
    }
}

try {
    Import-LocalEnv -Path (Join-Path $repoRoot ".env")
    Remove-Item -LiteralPath (Join-Path $repoRoot "test-results\evidence") -Recurse -Force -ErrorAction SilentlyContinue

    if (-not (Test-AppReady -Url $baseUrl)) {
        if ($reuseServer) {
            throw "E2E_REUSE_SERVER=1 was set, but $baseUrl is not responding."
        }

        $serverProcess = Start-Process `
            -FilePath "npm.cmd" `
            -ArgumentList @("run", "dev:local") `
            -WorkingDirectory $repoRoot `
            -WindowStyle Hidden `
            -RedirectStandardOutput (Join-Path $repoRoot "playwright-dev.out.log") `
            -RedirectStandardError (Join-Path $repoRoot "playwright-dev.err.log") `
            -PassThru

        $deadline = (Get-Date).AddSeconds(120)
        while ((Get-Date) -lt $deadline) {
            if (Test-AppReady -Url $baseUrl) {
                break
            }

            if ($serverProcess.HasExited) {
                $errPath = Join-Path $repoRoot "playwright-dev.err.log"
                $errText = if (Test-Path -LiteralPath $errPath) { Get-Content -LiteralPath $errPath -Raw } else { "" }
                throw "The E2E dev server exited before $baseUrl was ready. $errText"
            }

            Start-Sleep -Milliseconds 500
        }

        if (-not (Test-AppReady -Url $baseUrl)) {
            throw "Timed out waiting for $baseUrl."
        }
    }

    $env:E2E_START_SERVER = "0"
    & npx playwright test @args
    exit $LASTEXITCODE
}
finally {
    if ($serverProcess -and -not $serverProcess.HasExited) {
        Stop-ProcessTree -ProcessId $serverProcess.Id
    }
}
