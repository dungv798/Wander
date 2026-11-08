#requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Sinh 48 byte ngẫu nhiên; chỉ đưa vào clipboard, không in khóa hay ghi tệp.
function New-WanderRecoveryPepper {
    $randomBytes = New-Object byte[] 48
    $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $pepper = $null
    try {
        $generator.GetBytes($randomBytes)
        $pepper = [Convert]::ToBase64String($randomBytes)
        try {
            Set-Clipboard -Value $pepper -ErrorAction Stop | Out-Null
        } catch {
            throw 'Không sao chép được vào clipboard. Kiểm tra clipboard rồi chạy lại; không in khóa để xử lý lỗi.'
        }
        Write-Host ('Độ dài Base64: {0} ký tự.' -f $pepper.Length)
        Write-Host 'Dán vào password manager rồi dán vào Render, xóa clipboard sau.'
    } finally {
        [Array]::Clear($randomBytes, 0, $randomBytes.Length)
        $pepper = $null
        $generator.Dispose()
    }
}

New-WanderRecoveryPepper
