$env:FTP_USER = 'if0_42676827'
$env:FTP_PASS = 'iP0gKB3j6xX'
cd 'C:\laragon\www\ellena'
Remove-Item 'C:\laragon\www\ellena\upload-logs\worker-*.log' -Force -ErrorAction SilentlyContinue
& 'C:\laragon\www\ellena\ftp-parallel.ps1' -Root application -Workers 12 *>&1 |
    Out-File -FilePath 'C:\laragon\www\ellena\full-upload.log' -Encoding utf8