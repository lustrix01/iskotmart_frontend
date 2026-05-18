$ErrorActionPreference = "Stop"

$phpPath = "C:\xampp\php\php.exe"
$apiHost = "localhost"
$apiPort = "8000"
$apiTarget = "http://${apiHost}:${apiPort}"

if (-not (Test-Path -LiteralPath $phpPath)) {
    throw "XAMPP PHP was not found at $phpPath"
}

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$envPath = Join-Path $repoRoot ".env"

if (Test-Path -LiteralPath $envPath) {
    Get-Content -LiteralPath $envPath | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq "" -or $line.StartsWith("#") -or -not $line.Contains("=")) {
            return
        }

        $name, $value = $line.Split("=", 2)
        $name = $name.Trim()
        $value = $value.Trim().Trim('"').Trim("'")
        if ($name -match "^[A-Za-z_][A-Za-z0-9_]*$") {
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

$existingApi = Get-NetTCPConnection -LocalAddress $apiHost -LocalPort $apiPort -State Listen -ErrorAction SilentlyContinue
$apiProcess = $null

if ($existingApi) {
    $owner = ($existingApi | Select-Object -First 1).OwningProcess
    throw "Port ${apiPort} is already in use by process ${owner}. Stop the existing PHP API server, then run npm run dev:local again so .env is loaded into the new PHP process."
}

$apiProcess = Start-Process `
    -FilePath $phpPath `
    -ArgumentList @("-S", "${apiHost}:${apiPort}", "-t", ".") `
    -WorkingDirectory $repoRoot `
    -WindowStyle Hidden `
    -PassThru

Start-Sleep -Milliseconds 800

try {
    $env:VITE_API_PROXY_TARGET = $apiTarget
    npm run dev
}
finally {
    if ($apiProcess -and -not $apiProcess.HasExited) {
        Stop-Process -Id $apiProcess.Id -Force
    }
}
