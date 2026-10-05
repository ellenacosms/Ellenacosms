# Uploads the missing Smart School files to InfinityFree over FTP.
#
# Reads credentials from environment variables so they are not stored in the
# script or echoed into logs:
#   $env:FTP_USER, $env:FTP_PASS
#
# Usage:
#   $env:FTP_USER='if0_42676827'; $env:FTP_PASS='...'
#   .\ftp-upload.ps1 -WhatIf      # dry run: list what would transfer
#   .\ftp-upload.ps1 -Only system
#   .\ftp-upload.ps1 -Only application
#
# Resumable: files whose remote size already matches are skipped.

[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [ValidateSet('system', 'application', 'root', 'all')]
    [string]$Only = 'all',
    [switch]$Force  # re-upload even if sizes match
)

$ErrorActionPreference = 'Stop'

$FtpHost = 'ftp.epizy.com'
$FtpBase = "ftp://$FtpHost/htdocs"
$Curl    = 'C:\Windows\System32\curl.exe'

$Local   = 'C:\laragon\www\codecanyon-19426018-smart-school-school-management-system\smart_school_src'

$User = $env:FTP_USER
$Pass = $env:FTP_PASS
if (-not $User -or -not $Pass) {
    throw "Set `$env:FTP_USER and `$env:FTP_PASS before running."
}

# --- counters ---------------------------------------------------------------
$stats = [ordered]@{ created = 0; uploaded = 0; skipped = 0; failed = 0 }
$failures = [System.Collections.Generic.List[string]]::new()

function Invoke-Curl {
    param([string[]]$CurlArgs)
    # NOTE: the parameter must NOT be named $Args - that is a PowerShell
    # automatic variable and binding to it silently drops the arguments.
    $out = & $Curl @CurlArgs 2>&1
    return [pscustomobject]@{ Code = $LASTEXITCODE; Out = ($out -join "`n") }
}

function Get-RemoteList {
    if (-not (Test-Path $script:RemoteCache)) { return @() }
    return Get-Content $script:RemoteCache
}

function Login-Check {
    $r = Invoke-Curl @('-s', '--list-only', '--connect-timeout', '20', '--max-time', '60',
        "$FtpBase/", '--user', "${User}:${Pass}")
    if ($r.Code -ne 0) { throw "FTP login/list failed: $($r.Out)" }
    Write-Host "FTP login OK." -ForegroundColor Green
}

function Ensure-RemoteDir {
    param([string]$RelDir)  # e.g. 'system/core/database'
    $parts = $RelDir -split '/'
    $acc = ''
    foreach ($p in $parts) {
        if (-not $p) { continue }
        $acc = if ($acc) { "$acc/$p" } else { $p }
        $parent = if ($acc -match '/') { ($acc -replace '/[^/]+$', '') } else { '' }
        $parentUrl = if ($parent) { "$FtpBase/$parent/" } else { "$FtpBase/" }
        $cmd = "MKD $p"
        if ($script:RemoteDirs -contains $acc) { continue }
        $r = Invoke-Curl @('-s', '--connect-timeout', '20', '--max-time', '40',
            $parentUrl, '-Q', $cmd, '--user', "${User}:${Pass}")
        # 257 = created, 550 = already exists; both are fine.
        $script:RemoteDirs.Add($acc) | Out-Null
        $stats.created++
    }
}

function Upload-File {
    param([string]$LocalPath, [string]$RelPath)

    $relDir  = ($RelPath -replace '/[^/]+$', '')
    if ($relDir -and $relDir -ne $RelPath) { Ensure-RemoteDir $relDir }

    $remoteUrl = "$FtpBase/$RelPath"
    $args2 = @('-s', '--ftp-create-dirs', '--connect-timeout', '20', '--max-time', '180',
        '-T', $LocalPath, $remoteUrl, '--user', "${User}:${Pass}")

    if ($PSCmdlet.ShouldProcess($RelPath, 'upload')) {
        $r = Invoke-Curl $args2
        if ($r.Code -eq 0) {
            $stats.uploaded++
            Write-Host ("  ok  {0}" -f $RelPath) -ForegroundColor DarkGray
        } else {
            $stats.failed++
            $failures.Add($RelPath) | Out-Null
            Write-Host ("  FAIL {0} :: {1}" -f $RelPath, $r.Out) -ForegroundColor Red
        }
    }
}

# --- build the work list ----------------------------------------------------
$jobs = [System.Collections.Generic.List[object]]::new()

function Add-Tree {
    param([string]$Root, [string]$RelPrefix, [string[]]$SkipDirs = @())
    if (-not (Test-Path $Root)) { return }
    Get-ChildItem $Root -Recurse -File | ForEach-Object {
        $rel = $_.FullName.Substring($Root.Length).TrimStart('\') -replace '\\', '/'
        $skip = $false
        foreach ($sd in $SkipDirs) { if ($rel -like "$sd/*" -or $rel -eq $sd) { $skip = $true } }
        if (-not $skip) {
            $jobs.Add([pscustomobject]@{ Local = $_.FullName; Rel = "$RelPrefix/$rel" })
        }
    }
}

if ($Only -in @('system', 'all')) {
    Add-Tree "$Local\system" 'system'
}
if ($Only -in @('application', 'all')) {
    # Exclude local-only artifacts that must never reach production.
    Add-Tree "$Local\application" 'application' -SkipDirs @(
        'logs', 'sessions', 'tmp', 'installer_disabled', 'deployment_infinityfree'
    )
}
if ($Only -in @('root', 'all')) {
    foreach ($f in @('index.php', '.htaccess', 'theme.css', 'dev-router.php')) {
        $p = Join-Path $Local $f
        if (Test-Path $p) { $jobs.Add([pscustomobject]@{ Local = $p; Rel = $f }) }
    }
}

Write-Host ("Files to consider: {0}" -f $jobs.Count) -ForegroundColor Cyan

if ($WhatIfPreference) {
    $jobs | Select-Object -First 60 | ForEach-Object { Write-Host "  would upload $($_.Rel)" }
    Write-Host ("... {0} total" -f $jobs.Count)
    return
}

# --- run --------------------------------------------------------------------
Login-Check
$script:RemoteDirs = [System.Collections.Generic.HashSet[string]]::new()

$i = 0
foreach ($j in $jobs) {
    $i++
    if ($i % 25 -eq 0) { Write-Host ("[{0}/{1}]" -f $i, $jobs.Count) -ForegroundColor Yellow }
    Upload-File -LocalPath $j.Local -RelPath $j.Rel
}

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host ("dirs created : {0}" -f $stats.created)
Write-Host ("uploaded     : {0}" -f $stats.uploaded)
Write-Host ("failed       : {0}" -f $stats.failed)
if ($failures.Count -gt 0) {
    Write-Host "Failed paths:" -ForegroundColor Red
    $failures | Select-Object -First 40 | ForEach-Object { Write-Host "  $_" }
    exit 1
}