# Run once as Administrator: moves PgBouncer off port 3000 (default 6432).
# From repo root:  Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File scripts\fix-pgbouncer-port.ps1'

$ErrorActionPreference = 'Stop'
$path = 'C:\Program Files\PgBouncer\share\pgbouncer.ini'

if (-not (Test-Path $path)) {
    Write-Error "PgBouncer config not found: $path"
}

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error 'Run this script as Administrator (right-click PowerShell -> Run as administrator).'
}

$lines = Get-Content -Path $path
$changed = $false
$out = foreach ($line in $lines) {
    if ($line -match '^\s*listen_port\s*=\s*3000\s*$') {
        $changed = $true
        'listen_port = 6432'
    } else {
        $line
    }
}

if (-not $changed) {
    Write-Host 'listen_port was not 3000 (already changed or different value). No file edit.'
} else {
    # Set-Content -Encoding utf8 adds a BOM; PgBouncer rejects the file (syntax error line 1).
    $utf8 = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllLines($path, [string[]]$out, $utf8)
    Write-Host "Updated $path -> listen_port = 6432"
}

Restart-Service -Name pgbouncer -Force
Write-Host 'PgBouncer service restarted.'
Get-Service pgbouncer | Format-List Status, Name
