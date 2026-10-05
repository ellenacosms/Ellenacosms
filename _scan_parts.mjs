import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const dir =
  'C:\\laragon\\www\\codecanyon-19426018-smart-school-school-management-system\\smart_school_src\\application\\deployment_infinityfree';

// Prefer the built-in unzip in PowerShell via .NET
const ps = (script) =>
  execFileSync('powershell', ['-NoProfile', '-Command', script], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });

const script = `
Add-Type -AssemblyName System.IO.Compression.FileSystem
Get-ChildItem '${dir}\\site-part-*.zip' | Sort-Object Name | ForEach-Object {
  $z = [System.IO.Compression.ZipFile]::OpenRead($_.FullName)
  $sys = 0; $app = 0; $up = 0; $total = $z.Entries.Count
  foreach ($e in $z.Entries) {
    $n = $e.FullName
    if ($n -like 'system/*') { $sys++ }
    elseif ($n -like 'application/*') { $app++ }
    elseif ($n -like 'uploads/*') { $up++ }
  }
  $z.Dispose()
  "$($_.Name) total=$total system=$sys application=$app uploads=$up"
}
`;
console.log(ps(script));