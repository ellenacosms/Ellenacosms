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
