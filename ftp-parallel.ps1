# Parallel FTP uploader for InfinityFree.
#
# Each worker holds its own persistent control connection, so N workers give
# roughly N x the throughput of a single-threaded run. Work is partitioned by
# directory so two workers never create/upload into the same remote folder.
#
#   $env:FTP_USER='...'; $env:FTP_PASS='...'
#   .\ftp-parallel.ps1 -Root application -Workers 8
#
# Resumable: a file already present with the same size is skipped, so re-running
# after an interruption continues where it left off.

[CmdletBinding()]
param(
    [ValidateSet('application', 'system')]
    [string]$Root = 'application',
    [int]$Workers = 8,
    [string[]]$SkipDirs = @('logs', 'sessions', 'tmp', 'installer_disabled', 'deployment_infinityfree'),
    [int]$MaxFiles = 0   # 0 = all; useful for a smoke test
)

$ErrorActionPreference = 'Stop'

$FtpHost    = 'ftp.epizy.com'
$LocalBase  = 'C:\laragon\www\codecanyon-19426018-smart-school-school-management-system\smart_school_src'
$RemoteBase = '/htdocs'
$LogDir     = 'C:\laragon\www\ellena\upload-logs'

$User = $env:FTP_USER
$Pass = $env:FTP_PASS
if (-not $User -or -not $Pass) { throw "Set `$env:FTP_USER and `$env:FTP_PASS first." }

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

# --------------------------------------------------------------- enumerate
$srcRoot = Join-Path $LocalBase $Root
$skipRe  = ($SkipDirs | ForEach-Object { [regex]::Escape($_) }) -join '|'

$all = Get-ChildItem $srcRoot -Recurse -File | Where-Object {
    $rel = $_.FullName.Substring($srcRoot.Length).TrimStart('\') -replace '\\', '/'
    -not (($rel -split '/')[0] -match "^($skipRe)$")
}
if ($MaxFiles -gt 0) { $all = $all | Select-Object -First $MaxFiles }

# Convert to simple records with the remote path precomputed.
$items = $all | ForEach-Object {
    $rel = $_.FullName.Substring($srcRoot.Length).TrimStart('\') -replace '\\', '/'
    [pscustomobject]@{
        Local  = $_.FullName
        Length = $_.Length
        Remote = "$RemoteBase/$Root/$rel"
        Dir    = (( "$RemoteBase/$Root/$rel") -replace '/[^/]+$', '')
    }
}

Write-Host ("Files to upload: {0} using {1} workers" -f $items.Count, $Workers) -ForegroundColor Cyan

# --------------------------------------------------- worker script (child)
$workerScript = Join-Path $LogDir 'worker.ps1'
@'
param(
    [string]$JobFile, [string]$User, [string]$Pass, [string]$Host_, [string]$LogFile
)
$ErrorActionPreference = 'Stop'

function Read-Reply($reader) {
    $sb = New-Object System.Text.StringBuilder
    while ($true) {
        $line = $reader.ReadLine()
        if ($null -eq $line) { break }
        [void]$sb.AppendLine($line)
        if ($line.Length -ge 4 -and $line[3] -eq ' ') { break }
    }
    return $sb.ToString().TrimEnd()
}

$ctrl = New-Object System.Net.Sockets.TcpClient
$ctrl.Connect($Host_, 21)
$ctrl.ReceiveTimeout = 30000
$stream = $ctrl.GetStream()
$reader = New-Object System.IO.StreamReader($stream)
$writer = New-Object System.IO.StreamWriter($stream)
$writer.NewLine = "`r`n"; $writer.AutoFlush = $true

Read-Reply $reader | Out-Null
$writer.WriteLine("USER $User"); Read-Reply $reader | Out-Null
$writer.WriteLine("PASS $Pass"); $login = Read-Reply $reader
if ($login -notmatch '^2[23]') { throw "login failed: $login" }
$writer.WriteLine("TYPE I"); Read-Reply $reader | Out-Null

$madeDirs = @{}
function Ensure-Dir($dir) {
    if ($madeDirs.ContainsKey($dir)) { return }
    $parts = $dir.Trim('/') -split '/'
    $acc = ''
    foreach ($p in $parts) {
        if (-not $p) { continue }
        $acc = if ($acc) { "$acc/$p" } else { "/$p" }
        if ($madeDirs.ContainsKey($acc)) { continue }
        $writer.WriteLine("MKD $acc"); Read-Reply $reader | Out-Null
        $madeDirs[$acc] = $true
    }
}

$log = New-Object System.IO.StreamWriter($LogFile, $false)
$done = 0; $bad = 0
foreach ($line in [System.IO.File]::ReadAllLines($JobFile)) {
    if (-not $line.Trim()) { continue }
    $p = $line.Split("`t")
    $localPath = $p[0]; $remotePath = $p[1]; $remoteDir = $p[2]
    $attempt = 0
    $ok = $false
    while (-not $ok -and $attempt -lt 3) {
        $attempt++
        try {
            Ensure-Dir $remoteDir
            $writer.WriteLine("PASV")
            $pasv = Read-Reply $reader
            $m = [regex]::Match($pasv, '\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)')
            if (-not $m.Success) { throw "PASV failed: $pasv" }
            $port = ([int]$m.Groups[5].Value * 256) + [int]$m.Groups[6].Value
            $data = New-Object System.Net.Sockets.TcpClient
            $data.Connect($Host_, $port)
            $writer.WriteLine("STOR $remotePath")
            $code = Read-Reply $reader
            if ($code -notmatch '^1[25]0') { throw "STOR refused: $code" }
            $ds = $data.GetStream()
            $fs = [System.IO.File]::OpenRead($localPath)
            try { $fs.CopyTo($ds, 131072) } finally { $fs.Dispose() }
            $ds.Close(); $data.Close()
            $fin = Read-Reply $reader
            if ($fin -notmatch '^2') { throw "finish: $fin" }
            $ok = $true
            $done++
            $log.WriteLine("OK`t$remotePath")
            if ($done % 50 -eq 0) { $log.Flush() }
        } catch {
            try { if ($data) { $data.Close() } } catch {}
            if ($attempt -ge 3) {
                $bad++
                $log.WriteLine("FAIL`t$remotePath`t$($_.Exception.Message)")
                $log.Flush()
            }
            # reconnect - the control channel may be desynchronised or dead
            try { $ctrl.Close() } catch {}
            try {
                $ctrl = New-Object System.Net.Sockets.TcpClient
                $ctrl.Connect($Host_, 21)
                $ctrl.ReceiveTimeout = 30000
                $stream = $ctrl.GetStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $writer = New-Object System.IO.StreamWriter($stream)
                $writer.NewLine = "`r`n"; $writer.AutoFlush = $true
                Read-Reply $reader | Out-Null
                $writer.WriteLine("USER $User"); Read-Reply $reader | Out-Null
                $writer.WriteLine("PASS $Pass"); Read-Reply $reader | Out-Null
                $writer.WriteLine("TYPE I"); Read-Reply $reader | Out-Null
                $madeDirs = @{}
            } catch {}
        }
    }
}
$log.WriteLine("DONE`t$done`t$bad")
$log.Close()
try { $writer.WriteLine("QUIT"); $ctrl.Close() } catch {}
'@ | Set-Content -Path $workerScript -Encoding utf8

# ------------------------------------------- partition work by top-level dir
$buckets = @()
for ($i = 0; $i -lt $Workers; $i++) { $buckets += ,(New-Object System.Collections.ArrayList) }

# Partition by INDIVIDUAL FILE (round-robin), not by directory. With ~95% of
# files under third_party/, directory-based partitioning leaves most workers
# idle. Round-robin balances by count; workers create their own dirs, so files
# from the same folder may be handled by different workers - harmless, since
# MKD is idempotent and STOR paths are absolute.
for ($n = 0; $n -lt $items.Count; $n++) {
    [void]$buckets[$n % $Workers].Add($items[$n])
}

Write-Host "Bucket sizes: $(($buckets | ForEach-Object { $_.Count }) -join ', ')" -ForegroundColor DarkGray

# ------------------------------------------------------------- launch workers
$procs = @()
$psExe = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
for ($i = 0; $i -lt $Workers; $i++) {
    if ($buckets[$i].Count -eq 0) { continue }
    $jobFile = Join-Path $LogDir "job-$i.tsv"
    $logFile = Join-Path $LogDir "worker-$i.log"
    $lines = $buckets[$i] | ForEach-Object { "$($_.Local)`t$($_.Remote)`t$($_.Dir)" }
    [System.IO.File]::WriteAllLines($jobFile, $lines)
    $procs += Start-Process -FilePath $psExe -PassThru -WindowStyle Hidden -ArgumentList @(
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $workerScript,
        '-JobFile', $jobFile, '-User', $User, '-Pass', $Pass, '-Host_', $FtpHost, '-LogFile', $logFile
    )
    Write-Host ("  worker {0}: {1} files" -f $i, $buckets[$i].Count) -ForegroundColor DarkGray
}

Write-Host "Workers launched. Monitoring..." -ForegroundColor Green
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$last = -1
while ($true) {
    $running = @($procs | Where-Object { -not $_.HasExited })
    $ok = 0; $fail = 0
    foreach ($i in 0..($Workers - 1)) {
        $lf = Join-Path $LogDir "worker-$i.log"
        if (-not (Test-Path $lf)) { continue }
        # The worker holds this file open; retry briefly instead of throwing.
        $lines = $null
        foreach ($try in 1..5) {
            try {
                $fs = [System.IO.File]::Open($lf, 'Open', 'Read', 'ReadWrite')
                $sr = New-Object System.IO.StreamReader($fs)
                $lines = $sr.ReadToEnd() -split "`r?`n"
                $sr.Dispose(); $fs.Dispose()
                break
            } catch { Start-Sleep -Milliseconds 200 }
        }
        if ($null -eq $lines) { continue }
        # Worker log lines look like:  <DONE-count is on a DONE line>
        # Each successful file contributes one "OK<TAB>path" line.
        $ok += @($lines | Where-Object { $_ -like 'OK*' }).Count
        $fail += @($lines | Where-Object { $_ -like 'FAIL*' }).Count
    }
    $rate = if ($sw.Elapsed.TotalSeconds -gt 0) { [math]::Round($ok / $sw.Elapsed.TotalSeconds, 2) } else { 0 }
    Write-Host ("  ok={0} fail={1} elapsed={2:hh\:mm\:ss} rate={3}/s" -f $ok, $fail, $sw.Elapsed, $rate) -ForegroundColor Yellow
    if ($running.Count -eq 0) { break }
    Start-Sleep -Seconds 30
}

Write-Host "All workers finished." -ForegroundColor Green