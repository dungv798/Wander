# Cổng chất lượng backend (ADR-013). Chạy cục bộ y hệt CI; không cần secret, không deploy, không đụng AWS.
#   powershell -ExecutionPolicy Bypass -File tools\quality.ps1 <gate|secrets|deps|all>
#     gate    : ./gradlew check  (test + ArchUnit + Checkstyle + ngưỡng JaCoCo)
#     secrets : gitleaks quét cây làm việc, che giá trị bí mật trong báo cáo (cần Docker)
#     deps    : dựng bootJar rồi Trivy quét lỗ hổng HIGH/CRITICAL của thư viện đóng gói (cần Docker, cần mạng để tải CSDL lỗ hổng)
#     all     : cả ba, dừng ở bước đầu tiên lỗi
# Log ghi ở .logs/quality-<tác vụ>.log. Mã thoát khác 0 nghĩa là cổng đỏ.
param(
    [Parameter(Position = 0)]
    [ValidateSet('gate', 'secrets', 'deps', 'all')]
    [string]$Task = 'gate'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$logs = Join-Path $root '.logs'
New-Item -ItemType Directory -Force $logs | Out-Null

# Phiên bản ghim cho ảnh quét; đổi có chủ đích và ghi vào docs/implementation/decisions.md.
$gitleaksImage = 'zricethezav/gitleaks:v8.21.2'
$trivyImage = 'aquasec/trivy:0.76.1@sha256:790fd66d1697395d8693d1acaa1ea702406a20f109b6fc7bac8db623eca6c06c'

# Chạy một lệnh ngoài, ghi toàn bộ đầu ra vào log và trả mã thoát.
function Invoke-Logged([string]$Name, [scriptblock]$Command) {
    $log = Join-Path $logs "quality-$Name.log"
    # Công cụ ngoài ghi tiến trình ra stderr; không để PowerShell coi đó là lỗi, chỉ mã thoát mới quyết định.
    $ErrorActionPreference = 'Continue'
    & $Command *> $log
    $code = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    Write-Host ("[{0}] mã thoát {1}, log: {2}" -f $Name, $code, $log)
    return $code
}

# Cổng chính: ./gradlew check trong thư mục backend.
function Invoke-Gate {
    Push-Location (Join-Path $root 'backend')
    try { return (Invoke-Logged 'gate' { .\gradlew.bat check --console=plain }) } finally { Pop-Location }
}

# Quét bí mật bằng gitleaks trên cây làm việc; cấu hình ở .gitleaks.toml.
function Invoke-Secrets {
    return (Invoke-Logged 'secrets' {
        docker run --rm -v "${root}:/repo" $gitleaksImage detect --source=/repo --no-git --redact --no-banner `
            --config=/repo/.gitleaks.toml --exit-code 1
    })
}

# Quét lỗ hổng thư viện trong jar đóng gói bằng Trivy.
function Invoke-Deps {
    Push-Location (Join-Path $root 'backend')
    try {
        $code = Invoke-Logged 'deps-build' { .\gradlew.bat bootJar --console=plain }
        if ($code -ne 0) { return $code }
    } finally { Pop-Location }
    return (Invoke-Logged 'deps' {
        docker run --rm -v "${root}\backend\build\libs:/scan:ro" -v wander-trivy-cache:/root/.cache $trivyImage rootfs --timeout 30m `
            --scanners vuln --severity HIGH,CRITICAL --exit-code 1 --no-progress /scan
    })
}

$exit = 0
switch ($Task) {
    'gate' { $exit = Invoke-Gate }
    'secrets' { $exit = Invoke-Secrets }
    'deps' { $exit = Invoke-Deps }
    'all' {
        $exit = Invoke-Gate
        if ($exit -eq 0) { $exit = Invoke-Secrets }
        if ($exit -eq 0) { $exit = Invoke-Deps }
    }
}
exit $exit
