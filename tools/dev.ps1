<#
  Wander - lenh phat trien cho Windows (PowerShell 5.1+). Moi lenh ghi log vao .logs\<lenh>.log
  va ket qua vao .logs\<lenh>.status (PASS/FAIL) de doc lai duoc.

  Cach dung:  powershell -ExecutionPolicy Bypass -File tools\dev.ps1 <lenh>
  Lenh:
    doctor          Kiem tra phien ban cong cu (Java, Docker, Node, Git, RTK, code-review-graph...)
    install-runtime Cai JDK 21 (Microsoft OpenJDK) + Docker Desktop neu chua co
    install-tools   Cai RTK + code-review-graph (+ uv, ripgrep) va cau hinh cho Claude Code
    tools-check     Kiem tra RTK va code-review-graph chay duoc that
    db-up           Bat PostgreSQL (docker compose)
    backend-test    Chay toan bo test backend (JUnit, ArchUnit, Testcontainers PostgreSQL)
    backend-build   Build jar backend
    web-build       Cai dependency va build giao dien
    e2e             Build tat ca, chay backend Java + giao dien, chay cac kich ban trinh duyet that (web/e2e, backend that cong 8787)
    run             Bat PostgreSQL roi chay backend (cong 8787) phuc vu ca giao dien web/dist (chay web-build truoc)
    verify          doctor + tools-check + backend-test + e2e
#>
param([Parameter(Position = 0)][string]$Command = 'help')

$ErrorActionPreference = 'Continue'
$Root = Split-Path -Parent $PSScriptRoot
$Logs = Join-Path $Root '.logs'
New-Item -ItemType Directory -Force -Path $Logs | Out-Null
$env:RTK_TELEMETRY_DISABLED = '1'

function Refresh-Path {
    $machine = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $user = [Environment]::GetEnvironmentVariable('Path', 'User')
    $extra = @("$env:USERPROFILE\.local\bin", "$env:LOCALAPPDATA\Microsoft\WinGet\Links",
        "$env:ProgramFiles\Docker\Docker\resources\bin")
    $jdk = Find-Jdk
    if ($jdk) {
        $env:JAVA_HOME = $jdk
        $extra = @("$jdk\bin") + $extra
    }
    $env:Path = (@($extra) + @($machine, $user)) -join ';'
}

# Tim JDK da cai (uu tien 21, roi ban moi nhat >= 17) o cac vi tri pho bien, ke ca khi chua co trong PATH.
function Find-Jdk {
    $roots = @("$env:ProgramFiles\Java", "$env:ProgramFiles\Eclipse Adoptium", "$env:ProgramFiles\Microsoft",
        "$env:ProgramFiles\Amazon Corretto", "$env:ProgramFiles\Zulu", "$env:ProgramFiles\BellSoft",
        "$env:USERPROFILE\.jdks", "$env:LOCALAPPDATA\Programs\Eclipse Adoptium")
    $found = @()
    if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\java.exe")) { $found += Get-Item $env:JAVA_HOME }
    foreach ($r in $roots) {
        if (Test-Path $r) {
            $found += Get-ChildItem -Path $r -Directory -ErrorAction SilentlyContinue |
                Where-Object { Test-Path (Join-Path $_.FullName 'bin\java.exe') }
        }
    }
    $best = $null; $bestScore = -1
    foreach ($d in $found) {
        $m = [regex]::Match($d.Name, '(\d+)')
        $v = if ($m.Success) { [int]$m.Groups[1].Value } else { 0 }
        if ($v -eq 1) { $m2 = [regex]::Match($d.Name, '1\.(\d+)'); if ($m2.Success) { $v = [int]$m2.Groups[1].Value } }
        $score = if ($v -eq 21) { 1000 } elseif ($v -ge 17) { $v } else { -1 }
        if ($score -gt $bestScore) { $best = $d.FullName; $bestScore = $score }
    }
    return $best
}

function Has([string]$name) { return [bool](Get-Command $name -ErrorAction SilentlyContinue) }

function Run([string]$label, [scriptblock]$block) {
    Write-Host "==> $label"
    $global:LASTEXITCODE = 0
    # Dua moi dau ra (ca stderr) ra man hinh/transcript, KHONG vao pipeline: ham chi tra ve ma thoat.
    & $block 2>&1 | Out-Host
    $code = $global:LASTEXITCODE
    if ($null -eq $code) { $code = 0 }
    Write-Host "<== $label (exit $code)"
    return $code
}

function Doctor {
    Refresh-Path
    $fail = 0
    Write-Host ("JAVA_HOME = {0}" -f $(if ($env:JAVA_HOME) { $env:JAVA_HOME } else { '(khong tim thay JDK >= 17)' }))
    Write-Host ("Docker Desktop: {0}" -f $(if (Test-Path "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe") { 'da cai' } else { 'KHONG thay o Program Files\Docker' }))
    foreach ($t in @(
            @{ n = 'java'; a = @('-version') }, @{ n = 'docker'; a = @('version', '--format', '{{.Server.Version}}') },
            @{ n = 'node'; a = @('-v') }, @{ n = 'npm'; a = @('-v') }, @{ n = 'git'; a = @('--version') },
            @{ n = 'winget'; a = @('--version') }, @{ n = 'uv'; a = @('--version') }, @{ n = 'rg'; a = @('--version') },
            @{ n = 'rtk'; a = @('--version') }, @{ n = 'code-review-graph'; a = @('--version') })) {
        if (Has $t.n) {
            $out = (& $t.n @($t.a) 2>&1 | Select-Object -First 1)
            Write-Host ("[ok]   {0,-18} {1}" -f $t.n, $out)
        } else {
            Write-Host ("[miss] {0}" -f $t.n)
            if (@('java', 'docker', 'node', 'git') -contains $t.n) { $fail = 1 }
        }
    }
    if (Has 'docker') {
        $engine = (docker info --format '{{.ServerVersion}}' 2>$null)
        if ($LASTEXITCODE -eq 0 -and $engine) { Write-Host "[ok]   docker engine      $engine (dang chay)" }
        else { Write-Host '[miss] docker engine (Docker Desktop chua chay)'; $fail = 1 }
    }
    return $fail
}

function Install-Tools {
    Install-Runtime | Out-Null
    Refresh-Path
    if (-not (Has 'winget')) { Write-Host 'Khong co winget: cai App Installer tu Microsoft Store.'; return 1 }
    $wg = @('--exact', '--silent', '--accept-source-agreements', '--accept-package-agreements', '--disable-interactivity')
    foreach ($t in @(@('rtk', 'rtk-ai.rtk'), @('uv', 'astral-sh.uv'), @('rg', 'BurntSushi.ripgrep.MSVC'))) {
        $cmd = $t[0]; $id = $t[1]
        if (Has $cmd) { Write-Host "[ok] $cmd da co"; continue }
        Run "winget install $id" { winget install --id $id @wg } | Out-Null
    }
    Refresh-Path
    if (-not (Has 'rtk')) { Write-Host 'Khong tim thay rtk sau khi cai.'; return 1 }
    if (-not (Has 'uv')) { Write-Host 'Khong tim thay uv sau khi cai.'; return 1 }

    # RTK: hook toan cuc cho Claude Code (~/.claude/settings.json, co sao luu .bak). Telemetry tat.
    Run 'rtk init -g --auto-patch' { rtk init -g --auto-patch } | Out-Null

    # code-review-graph: cai bang uv (tu lo Python rieng), cau hinh MCP + hook cho Claude Code trong du an nay.
    # Ghim Python 3.12: ban Python moi nhat chua co wheel tree-sitter cho Windows (phai build bang MSVC).
    Run 'uv tool install code-review-graph' { uv tool install --python 3.12 --upgrade code-review-graph } | Out-Null
    Refresh-Path
    $env:PYTHONUTF8 = '1'
    Push-Location $Root
    # Chi chay 'install' lan dau: no ghi de .claude/settings.json va .mcp.json (da duoc gop tay sau lan dau).
    $mcp = Join-Path $Root '.mcp.json'
    if ((Test-Path $mcp) -and ((Get-Content $mcp -Raw) -match 'code-review-graph')) {
        Write-Host '[ok] code-review-graph da cau hinh cho Claude Code (.mcp.json) - bo qua install'
    } else {
        Run 'code-review-graph install' { code-review-graph install --platform claude-code --repo $Root --yes } | Out-Null
    }
    Run 'code-review-graph build' { code-review-graph build --repo $Root } | Out-Null
    Pop-Location
    return (Tools-Check)
}

function Install-Runtime {
    Refresh-Path
    $wg = @('--exact', '--accept-source-agreements', '--accept-package-agreements', '--disable-interactivity')
    $code = 0
    if (-not (Find-Jdk)) {
        $code = Run 'winget install Microsoft.OpenJDK.21' { winget install --id Microsoft.OpenJDK.21 --silent @wg }
    } else { Write-Host "[ok] JDK: $(Find-Jdk)" }
    if (-not (Test-Path "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe")) {
        Write-Host 'Docker Desktop can quyen admin: hay bam Yes o hop thoai UAC. Co the phai khoi dong lai may (WSL2).'
        $c2 = Run 'winget install Docker.DockerDesktop' { winget install --id Docker.DockerDesktop @wg }
        if ($c2 -ne 0) { $code = $c2 }
    } else { Write-Host '[ok] Docker Desktop da cai' }
    return $code
}

function Tools-Check {
    Refresh-Path
    $env:PYTHONUTF8 = '1'
    $fail = 0
    if ((Run 'rtk --version' { rtk --version }) -ne 0) { $fail = 1 }
    if ((Run 'rtk gain (phai hien bang tiet kiem token)' { rtk gain }) -ne 0) { $fail = 1 }
    Run 'rtk init --show' { rtk init --show } | Out-Null
    Push-Location $Root
    if ((Run 'rtk git status (lenh that qua RTK)' { rtk git status }) -ne 0) { $fail = 1 }
    if ((Run 'code-review-graph --version' { code-review-graph --version }) -ne 0) { $fail = 1 }
    if ((Run 'code-review-graph status' { code-review-graph status --repo $Root }) -ne 0) { $fail = 1 }
    Pop-Location
    if (Test-Path (Join-Path $Root '.mcp.json')) { Write-Host '[ok] .mcp.json:'; Get-Content (Join-Path $Root '.mcp.json') | Out-Host }
    else { Write-Host '[miss] .mcp.json'; $fail = 1 }
    return $fail
}

function Db-Up {
    Push-Location $Root
    $code = Run 'docker compose up -d postgres' { docker compose up -d --wait postgres }
    Pop-Location
    return $code
}

function Backend-Test {
    Push-Location (Join-Path $Root 'backend')
    $code = Run 'gradlew test' { .\gradlew.bat test --no-daemon --console=plain }
    Pop-Location
    return $code
}

function Backend-Build {
    Push-Location (Join-Path $Root 'backend')
    $code = Run 'gradlew bootJar' { .\gradlew.bat bootJar --no-daemon --console=plain }
    Pop-Location
    return $code
}

function Web-Build {
    Push-Location $Root
    $code = Run 'npm install (root)' { npm install --no-audit --no-fund }
    if ($code -eq 0) { $code = Run 'npm install (web)' { npm --prefix web install --no-audit --no-fund } }
    if ($code -eq 0) { $code = Run 'web build' { npm --prefix web run build } }
    Pop-Location
    return $code
}

function Wait-Health([string]$url, [int]$seconds) {
    $deadline = (Get-Date).AddSeconds($seconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 $url
            if ($r.StatusCode -eq 200) { return $true }
        } catch { Start-Sleep -Milliseconds 700 }
    }
    return $false
}

# Khóa HMAC băm mã khôi phục (DR-018 B3): dùng biến môi trường nếu đã đặt, nếu không thì sinh một khóa cục bộ ngẫu nhiên và nhớ ở
# .logs\dev-recovery-pepper.txt (thư mục bị git bỏ qua) để dữ liệu thử còn dùng được sau khi chạy lại. Không in khóa ra màn hình.
function Ensure-RecoveryPepper {
    if ($env:WANDER_RECOVERY_PEPPER) { return }
    $file = Join-Path $Logs 'dev-recovery-pepper.txt'
    if (-not (Test-Path $file)) {
        $bytes = New-Object byte[] 48
        [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
        Set-Content -Path $file -Value ([Convert]::ToBase64String($bytes)) -Encoding ascii
    }
    $env:WANDER_RECOVERY_PEPPER = (Get-Content -Path $file -Raw).Trim()
}

# Ten co so du lieu RIENG cho e2e (DR-033, T-A): e2e KHONG BAO GIO ghi vao CSDL dev wander.
$E2eDb = 'wander_e2e'

# Tao lai CSDL e2e tu dau (Flyway dung schema khi backend khoi dong). Tu choi neu ten khong phai dung wander_e2e.
function Reset-E2eDb {
    if ($E2eDb -ne 'wander_e2e') { Write-Host "Tu choi: ten CSDL e2e phai la wander_e2e, nhan $E2eDb"; return 1 }
    Push-Location $Root
    docker compose exec -T postgres psql -U wander -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS $E2eDb WITH (FORCE)" | Out-Null
    $drop = $LASTEXITCODE
    docker compose exec -T postgres psql -U wander -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE $E2eDb" | Out-Null
    $create = $LASTEXITCODE
    Pop-Location
    if (($drop -ne 0) -or ($create -ne 0)) { Write-Host "Khong tao duoc CSDL $E2eDb"; return 1 }
    return 0
}

function E2E {
    if ((Db-Up) -ne 0) { return 1 }
    if ((Reset-E2eDb) -ne 0) { return 1 }
    if ((Backend-Build) -ne 0) { return 1 }
    if ((Web-Build) -ne 0) { return 1 }
    $jar = Join-Path $Root 'backend\build\libs\wander-backend.jar'
    $port = 8787 # cổng mà proxy /api của Vite trong web/ trỏ tới
    $env:PORT = "$port"
    $env:WANDER_WEB_DIR = (Join-Path $Root 'web\dist')
    $env:WANDER_LIMIT_IDENTITY = '1000'
    $env:WANDER_LIMIT_RECOVERY = '1000'
    $env:WANDER_LIMIT_APPROVAL = '1000'
    $env:WANDER_LIMIT_APPROVAL_REQUESTS = '1000'
    $env:WANDER_LIMIT_CATALOG = '100000'
    $env:WANDER_DB_URL = "jdbc:postgresql://localhost:5433/$E2eDb"
    $env:WANDER_E2E_DB = $E2eDb # e2e/backend.ts chi chay khi bien nay dung wander_e2e
    if ($env:WANDER_DB_URL -notmatch '/wander_e2e$') { Write-Host 'Tu choi chay e2e: WANDER_DB_URL khong tro toi wander_e2e.'; return 1 }
    Ensure-RecoveryPepper
    $out = Join-Path $Logs 'e2e-backend.out.log'
    $err = Join-Path $Logs 'e2e-backend.err.log'
    $proc = Start-Process -FilePath 'java' -ArgumentList @('-jar', $jar) -PassThru -NoNewWindow `
        -RedirectStandardOutput $out -RedirectStandardError $err
    try {
        if (-not (Wait-Health "http://127.0.0.1:$port/actuator/health" 120)) {
            Write-Host 'Backend khong khoi dong duoc. Xem .logs\e2e-backend.*.log'
            return 1
        }
        $env:WANDER_BASE_URL = "http://127.0.0.1:$port"
        Push-Location (Join-Path $Root 'web')
        $code = Run 'e2e web (node --test, trinh duyet Edge/Chrome that, backend that)' { npm run e2e }
        Pop-Location
        return $code
    } finally {
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        Remove-Item Env:\WANDER_BASE_URL, Env:\PORT -ErrorAction SilentlyContinue
    }
}

function Run-Backend {
    if ((Db-Up) -ne 0) { return 1 }
    Ensure-RecoveryPepper
    $env:WANDER_WEB_DIR = (Join-Path $Root 'web\dist')
    Push-Location (Join-Path $Root 'backend')
    $code = Run 'gradlew bootRun' { .\gradlew.bat bootRun --console=plain }
    Pop-Location
    return $code
}

function Verify {
    $results = [ordered]@{}
    $results['doctor'] = Doctor
    $results['tools-check'] = Tools-Check
    $results['backend-test'] = Backend-Test
    $results['e2e'] = E2E
    Write-Host ''
    $fail = 0
    foreach ($k in $results.Keys) {
        $v = @($results[$k])[-1]
        Write-Host ("{0,-14} {1}" -f $k, $(if ($v -eq 0) { 'PASS' } else { 'FAIL' }))
        if ($v -ne 0) { $fail = 1 }
    }
    return $fail
}

$log = Join-Path $Logs "$Command.log"
$status = Join-Path $Logs "$Command.status"
Set-Content -Path $status -Value 'RUNNING' -Encoding ascii
$started = Get-Date
$result = 1
try {
    Start-Transcript -Path $log -Force | Out-Null
    Refresh-Path
    $r = switch ($Command) {
        'doctor' { Doctor }
        'install-tools' { Install-Tools }
        'install-runtime' { Install-Runtime }
        'tools-check' { Tools-Check }
        'db-up' { Db-Up }
        'backend-test' { Backend-Test }
        'backend-build' { Backend-Build }
        'web-build' { Web-Build }
        'e2e' { E2E }
        'run' { Run-Backend }
        'verify' { Verify }
        default { Get-Help $PSCommandPath; 0 }
    }
    $result = @($r)[-1]
} finally {
    $secs = [int]((Get-Date) - $started).TotalSeconds
    Write-Host ("RESULT: {0} ({1}s)" -f $(if ($result -eq 0) { 'PASS' } else { 'FAIL' }), $secs)
    Stop-Transcript | Out-Null
    Set-Content -Path $status -Value $(if ($result -eq 0) { 'PASS' } else { 'FAIL' }) -Encoding ascii
}
exit $result
