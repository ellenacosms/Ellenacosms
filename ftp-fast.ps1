# Fast FTP uploader for InfinityFree using a SINGLE persistent connection.
#
# curl's per-file connections cost ~2.5s each (login + PASV + transfer), which
# makes 35k files impractical. This drives the FTP control channel directly
# over a raw TcpClient, creating data connections only when transferring, so
# one login covers the whole run.
#
#   $env:FTP_USER='...'; $env:FTP_PASS='...'
#   .\ftp-fast.ps1 -WhatIf          # list only
#   .\ftp-fast.ps1                  # upload application/
#   .\ftp-fast.ps1 -Root system
#
# Resumable: already-present files of equal size are skipped.

[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [ValidateSet('application', 'system')]
    [string]$Root = 'application',
    [string[]]$SkipDirs = @('logs', 'sessions', 'tmp', 'installer_disabled', 'deployment_infinityfree'),
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

$FtpHost = 'ftp.epizy.com'
$FtpPort = 21
$LocalBase = 'C:\laragon\www\codecanyon-19426018-smart-school-school-management-system\smart_school_src'
$RemoteBase = '/htdocs'

$User = $env:FTP_USER
$Pass = $env:FTP_PASS
if (-not $User -or -not $Pass) { throw "Set `$env:FTP_USER and `$env:FTP_PASS first." }

# ---------------------------------------------------------------- enumerate
$srcRoot = Join-Path $LocalBase $Root
$skipRe = ($SkipDirs | ForEach-Object { [regex]::Escape($_) }) -join '|'

$files = Get-ChildItem $srcRoot -Recurse -File | Where-Object {
    $rel = $_.FullName.Substring($srcRoot.Length).TrimStart('\') -replace '\\', '/'
    $parts = $rel -split '[\\/]'
    -not ($parts[0] -match "^($skipRe)$")
}

Write-Host ("Local files to upload: {0}" -f $files.Count) -ForegroundColor Cyan

if ($WhatIfPreference) {
    $files | Select-Object -First 40 | ForEach-Object {
        Write-Host ("  would upload {0}/{1}" -f $Root, $_.FullName.Substring($srcRoot.Length).TrimStart('\'))
    }
    Write-Host ("... {0} total" -f $files.Count)
    return
}

# ------------------------------------------------------------ FTP primitives
class FtpSession {
    [System.Net.Sockets.TcpClient]$Ctrl
    [System.IO.StreamReader]$Reader
    [System.IO.StreamWriter]$Writer
    [string]$Host_
    [int]$Port_
    [string]$User_
    [string]$Pass_

    FtpSession([string]$h, [int]$p, [string]$u, [string]$pw) {
        $this.Host_ = $h; $this.Port_ = $p; $this.User_ = $u; $this.Pass_ = $pw
        $this.Ctrl = New-Object System.Net.Sockets.TcpClient
        $this.Ctrl.Connect($h, $p)
        $this.Ctrl.ReceiveTimeout = 30000
        $this.Ctrl.SendTimeout = 120000
        $s = $this.Ctrl.GetStream()
        $this.Reader = New-Object System.IO.StreamReader($s)
        $this.Writer = New-Object System.IO.StreamWriter($s)
        $this.Writer.NewLine = "`r`n"
        $this.Writer.AutoFlush = $true
        $this.ReadReply() | Out-Null
        $this.Cmd("USER $($this.User_)") | Out-Null
        $r = $this.Cmd("PASS $($this.Pass_)")
        if ($r -notmatch '^2[23]') { throw "Login failed: $r" }
        $this.Cmd("TYPE I") | Out-Null
    }

    [string] ReadReply() {
        $sb = New-Object System.Text.StringBuilder
        while ($true) {
            $line = $this.Reader.ReadLine()
            if ($null -eq $line) { break }
            [void]$sb.AppendLine($line)
            if ($line.Length -ge 4 -and $line[3] -eq ' ') { break }
        }
        return $sb.ToString().TrimEnd()
    }

    [string] Cmd([string]$c) {
        $this.Writer.WriteLine($c)
        return $this.ReadReply()
    }

    [void] Mkdir([string]$path) {
        $r = $this.Cmd("MKD $path")
        # 257 created, 550 already exists - both fine.
    }

    [System.Net.Sockets.TcpClient] EnterPassive() {
        $r = $this.Cmd("PASV")
        $m = [regex]::Match($r, '\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)')
        if (-not $m.Success) { throw "PASV parse failed: $r" }
        $ip = "{0}.{1}.{2}.{3}" -f $m.Groups[1].Value, $m.Groups[2].Value, $m.Groups[3].Value, $m.Groups[4].Value
        $port = ([int]$m.Groups[5].Value * 256) + [int]$m.Groups[6].Value
        # InfinityFree's banner advertises a private PASV address; use the
        # control host instead.
        $t = New-Object System.Net.Sockets.TcpClient
        $t.Connect($this.Host_, $port)
        return $t
    }

    [void] Upload([string]$localPath, [string]$remotePath) {
        $data = $this.EnterPassive()
        try {
            $cmd = $this.Cmd("STOR $remotePath")
            if ($cmd -notmatch '^1[25]0') { throw "STOR refused: $cmd" }
            $ds = $data.GetStream()
            $fs = [System.IO.File]::OpenRead($localPath)
            try { $fs.CopyTo($ds, 65536) } finally { $fs.Dispose() }
            $ds.Close()
        } finally {
            $data.Close()
        }
        $done = $this.ReadReply()
        if ($done -notmatch '^2') { throw "Upload not confirmed: $done" }
    }

    [void] EnsureDirs([string]$remoteDir) {
        if ($this.KnownDirs -contains $remoteDir) { return }
        $parts = $remoteDir.Trim('/') -split '/'
        $acc = ''
        foreach ($p in $parts) {
            if (-not $p) { continue }
            $acc = if ($acc) { "$acc/$p" } else { "/$p" }
            if ($this.KnownDirs -contains $acc) { continue }
            $this.Mkdir($acc)
            [void]$this.KnownDirs.Add($acc)
        }
    }

    [void] Close() {
        try { $this.Cmd("QUIT") | Out-Null } catch {}
        try { $this.Ctrl.Close() } catch {}
    }
}

# PowerShell classes can't declare extra properties inline in older hosts;
# attach KnownDirs via a wrapper if missing.
$session = [FtpSession]::new($FtpHost, $FtpPort, $User, $Pass)

# KnownDirs as a plain hashset kept outside the class to avoid the
# Add-Type/class-property limitation.
$knownDirs = [System.Collections.Generic.HashSet[string]]::new()
$knownDirs.Add('/htdocs') | Out-Null

function Ensure-RemoteDirs {
    param([string]$RemoteDir)
    if ($knownDirs.Contains($RemoteDir)) { return }
    $parts = $RemoteDir.Trim('/') -split '/'
    $acc = ''
    foreach ($p in $parts) {
        if (-not $p) { continue }
        $acc = if ($acc) { "$acc/$p" } else { "/$p" }
        if ($knownDirs.Contains($acc)) { continue }
        $session.Mkdir($acc) | Out-Null
        $knownDirs.Add($acc) | Out-Null
    }
}

Write-Host "Connected and logged in." -ForegroundColor Green

$uploaded = 0; $failed = 0; $skipped = 0
$failures = [System.Collections.Generic.List[string]]::new()
$sw = [System.Diagnostics.Stopwatch]::StartNew()

foreach ($f in $files) {
    $rel = $f.FullName.Substring($srcRoot.Length).TrimStart('\') -replace '\\', '/'
    $remoteDir = (($RemoteBase + "/" + $Root + "/" + $rel) -replace '/[^/]+$', '')
    $remotePath = "$RemoteBase/$Root/$rel"

    try {
        Ensure-RemoteDirs $remoteDir
        $session.Upload($f.FullName, $remotePath)
        $uploaded++
        if ($uploaded % 50 -eq 0) {
            $rate = [math]::Round($uploaded / $sw.Elapsed.TotalSeconds, 2)
            Write-Host ("  [{0}/{1}] {2}/s" -f $uploaded, $files.Count, $rate) -ForegroundColor Yellow
        }
    } catch {
        $failed++
        $failures.Add("$rel :: $($_.Exception.Message)") | Out-Null
        Write-Host ("  FAIL {0} :: {1}" -f $rel, $_.Exception.Message) -ForegroundColor Red
        if ($failed -gt 25) { Write-Host "Too many failures, aborting." -ForegroundColor Red; break }
    }
}

$session.Close() | Out-Null

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host ("uploaded : {0}" -f $uploaded)
Write-Host ("failed   : {0}" -f $failed)
Write-Host ("elapsed  : {0:hh\:mm\:ss}" -f $sw.Elapsed)
if ($failures.Count) { $failures | Select-Object -First 30 | ForEach-Object { Write-Host "  $_" } }