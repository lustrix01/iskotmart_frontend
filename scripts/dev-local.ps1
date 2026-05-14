$ErrorActionPreference = "Stop"

$phpPath = "C:\xampp\php\php.exe"
$apiHost = "127.0.0.1"
$apiPort = "8000"
$apiTarget = "http://${apiHost}:${apiPort}"

if (-not (Test-Path -LiteralPath $phpPath)) {
    throw "XAMPP PHP was not found at $phpPath"
}

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$existingApi = Get-NetTCPConnection -LocalAddress $apiHost -LocalPort $apiPort -State Listen -ErrorAction SilentlyContinue
$apiProcess = $null

if (-not $existingApi) {
    $apiProcess = Start-Process `
        -FilePath $phpPath `
        -ArgumentList @("-S", "${apiHost}:${apiPort}", "-t", ".") `
        -WorkingDirectory $repoRoot `
        -WindowStyle Hidden `
        -PassThru

    Start-Sleep -Milliseconds 800
}

try {
    $env:VITE_API_PROXY_TARGET = $apiTarget
    npm run dev
}
finally {
    if ($apiProcess -and -not $apiProcess.HasExited) {
        Stop-Process -Id $apiProcess.Id -Force
    }
}
