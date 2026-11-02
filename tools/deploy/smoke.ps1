<#
  Kiểm image với PostgreSQL tạm, không mount dữ liệu local. Chạy từ root:
  powershell -NoProfile -ExecutionPolicy Bypass -File tools/deploy/smoke.ps1 [-FullE2e]
  Mọi credential chỉ dành cho DB tạm được sinh ngẫu nhiên, lưu .logs, không in ra stdout.
#>
param([string]$Image = 'wander:deploy-audit', [int]$Port = 18787, [switch]$FullE2e)
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$runId = 'wander-audit-' + [Guid]::NewGuid().ToString('N').Substring(0, 10)
$network = $runId
$database = "$runId-db"
$application = "$runId-app"
$logDir = Join-Path $projectRoot '.logs'
$dbEnvFile = Join-Path $logDir "$runId-db.env"
$appEnvFile = Join-Path $logDir "$runId-app.env"
$oldBaseUrl = $env:WANDER_BASE_URL

# Secret chỉ dùng cho lượt test này, không dùng lại credential của app local hay cloud.
function New-TestSecret {
    $bytes = New-Object byte[] 48
    $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $generator.GetBytes($bytes) } finally { $generator.Dispose() }
    return [Convert]::ToBase64String($bytes)
}

# Mã thoát khác 0 phải dừng smoke, không báo xanh từ đầu ra lỗi của Docker.
function Assert-Docker([string]$Step) {
    if ($LASTEXITCODE -ne 0) { throw "Docker failed: $Step" }
}

try {
    New-Item -ItemType Directory -Force -Path $logDir | Out-Null
    $password = New-TestSecret
    @('POSTGRES_DB=wander', 'POSTGRES_USER=wander', "POSTGRES_PASSWORD=$password") |
        Set-Content -LiteralPath $dbEnvFile -Encoding ascii
    @("WANDER_DB_URL=jdbc:postgresql://${database}:5432/wander", 'WANDER_DB_USER=wander', "WANDER_DB_PASSWORD=$password",
        "WANDER_RECOVERY_PEPPER=$(New-TestSecret)", 'WANDER_RECOVERY_KEY_VERSION=v1', 'WANDER_TRUSTED_PROXY_HOPS=0',
        'WANDER_LIMIT_IDENTITY=100000', 'WANDER_LIMIT_RECOVERY=100000', 'WANDER_LIMIT_APPROVAL=100000',
        'WANDER_LIMIT_APPROVAL_REQUESTS=100000', 'WANDER_LIMIT_CATALOG=100000', 'WANDER_LIMIT_WRITES=100000') |
        Set-Content -LiteralPath $appEnvFile -Encoding ascii
    docker network create $network | Out-Null
    Assert-Docker 'network create'
    docker run -d --name $database --network $network --env-file $dbEnvFile postgres:17-alpine | Out-Null
    Assert-Docker 'database start'
    $dbReady = $false
    for ($attempt = 0; $attempt -lt 90; $attempt++) {
        docker exec $database pg_isready -U wander -d wander *> $null
        if ($LASTEXITCODE -eq 0) { $dbReady = $true; break }
        Start-Sleep -Milliseconds 500
    }
    if (-not $dbReady) { throw 'Temporary PostgreSQL did not start' }
    docker run -d --name $application --network $network --env-file $appEnvFile `
        --memory 512m --memory-swap 512m --cpus 1 --cap-drop ALL --security-opt no-new-privileges `
        --read-only --tmpfs '/tmp:rw,nosuid,size=64m' -p "127.0.0.1:${Port}:8787" $Image | Out-Null
    Assert-Docker 'application start'
    $base = "http://127.0.0.1:$Port"
    $startedAt = Get-Date
    $ready = $false
    for ($attempt = 0; $attempt -lt 240; $attempt++) {
        try {
            $health = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 "$base/actuator/health/readiness"
            if ($health.StatusCode -eq 200) { $ready = $true; break }
        } catch { Start-Sleep -Milliseconds 500 }
    }
    if (-not $ready) { throw 'Application did not become ready within the smoke deadline' }
    $startupSeconds = ((Get-Date) - $startedAt).TotalSeconds
    $homeResponse = Invoke-WebRequest -UseBasicParsing "$base/"
    if ($homeResponse.StatusCode -ne 200 -or -not $homeResponse.Headers['Content-Security-Policy']) { throw 'Production HTML/CSP smoke failed' }
    $catalog = Invoke-WebRequest -UseBasicParsing "$base/api/catalog/destinations"
    if ($catalog.StatusCode -ne 200) { throw 'Catalog smoke failed' }
    Write-Output ('Ready at {0}, cold startup {1:N1}s; temporary app capped at 512 MiB / 1 CPU' -f $base, $startupSeconds)
    if ($FullE2e) {
        $env:WANDER_BASE_URL = $base
        Push-Location $projectRoot
        try {
            $ErrorActionPreference = 'Continue'
            npm --prefix web run e2e *> (Join-Path $logDir 'deploy-container-e2e.log')
            $browserCode = $LASTEXITCODE
            $ErrorActionPreference = 'Stop'
            if ($browserCode -ne 0) { throw 'Browser suite failed; see .logs/deploy-container-e2e.log' }
        } finally { Pop-Location }
    }
    $peak = docker exec $application cat /sys/fs/cgroup/memory.peak
    $current = docker exec $application cat /sys/fs/cgroup/memory.current
    $oom = docker inspect --format '{{.State.OOMKilled}}' $application
    $runtimeUser = docker inspect --format '{{.Config.User}}' $application
    $imageId = docker inspect --format '{{.Image}}' $application
    $metrics = [ordered]@{ image = $imageId; startupSeconds = $startupSeconds; peakMemoryBytes = [long]$peak;
        currentMemoryBytes = [long]$current; oomKilled = $oom; user = $runtimeUser; fullE2e = $FullE2e.IsPresent }
    $metrics | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $logDir 'deploy-container-metrics.json') -Encoding UTF8
    $metrics | ConvertTo-Json -Compress | Write-Output
    if ($oom -ne 'false' -or $runtimeUser -ne 'wander') { throw 'Container runtime security or OOM smoke failed' }
} finally {
    $ErrorActionPreference = 'Continue'
    docker logs $application *> (Join-Path $logDir 'deploy-container-backend.log')
    docker rm -f $application $database *> $null
    docker network rm $network *> $null
    Remove-Item -LiteralPath $dbEnvFile, $appEnvFile -Force -ErrorAction SilentlyContinue
    $env:WANDER_BASE_URL = $oldBaseUrl
}
