$env:FTP_USER = 'if0_42676827'
$env:FTP_PASS = 'iP0gKB3j6xX'
& 'C:\laragon\www\ellena\ftp-fast.ps1' -Root application *>&1 |
    Out-File -FilePath 'C:\laragon\www\ellena\fast-upload.log' -Encoding utf8